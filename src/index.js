import { Router } from 'express';
import axios from 'axios';
import { encrypt, decrypt } from './utilities.js';

/**
 * Creates an Express Router with proxy routes for the Year of Prayer API.
 *
 * @param {{ apiUrl: string, clientId: string, encryptionKey: string, platform?: string }} config
 * @returns {import('express').Router}
 */
export function createPrayingRouter({ apiUrl, clientId, encryptionKey, platform = 'year of prayer proxy' }) {
  const router = Router();

  /**
   * POST /register
   * Registers a new consumer with the upstream API and returns an encrypted API key.
   */
  router.post('/register', async (req, res) => {
    if (!apiUrl) {
      return res.status(500).json({ success: false, message: 'apiUrl is not configured.', data: null });
    }
    if (!clientId) {
      return res.status(500).json({ success: false, message: 'clientId is not configured.', data: null });
    }

    const body = req.body || {};
    const data = {
      device_model: typeof body.device_model === 'string' ? body.device_model : platform,
      device_platform: typeof body.device_platform === 'string' ? body.device_platform : platform,
      device_version: typeof body.device_version === 'string' ? body.device_version : platform,
      device_uuid: typeof body.device_uuid === 'string' ? body.device_uuid : '',
      push_token: typeof body.push_token === 'string' ? body.push_token : '',
      push_at: typeof body.push_at === 'string' ? body.push_at : '10:00:00',
      push_lang: typeof body.push_lang === 'string' ? body.push_lang : 'eng',
      time_zone: typeof body.time_zone === 'string' ? body.time_zone : 'UTC',
      receive_push: body.receive_push === 1 || body.receive_push === true ? 1 : 0,
    };

    try {
      const response = await axios.post(`${apiUrl}/consumers/register`, data, {
        headers: { 'yop-client-application-id': clientId },
      });
      if (response.data && response.data.status === 'success') {
        const apiKey = response.data.success.data.api_key;
        const encrypted = encrypt(encryptionKey, apiKey);
        return res.json({ success: true, message: 'Success', data: encrypted });
      }
      return res.json({ success: false, message: 'Unexpected response from upstream.', data: null });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'An internal error occurred.', data: null });
    }
  });

  /**
   * POST /praying
   * Records a prayer for the given month/day using the provided encrypted API key.
   */
  router.post('/praying', async (req, res) => {
    const { apiKey, month, day } = req.body || {};
    if (!apiKey || !month || !day) {
      return res.status(400).json({ success: false, message: 'Invalid request.', data: null });
    }
    if (!apiUrl) {
      return res.status(500).json({ success: false, message: 'apiUrl is not configured.', data: null });
    }

    const decrypted = decrypt(encryptionKey, apiKey.iv, apiKey.encryptedData);
    const id = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    try {
      const response = await axios.post(`${apiUrl}/prayers/${id}/praying`, undefined, {
        headers: { 'yop-api-key': decrypted },
      });
      if (response.data && response.data.status === 'success') {
        return res.json({ success: true, message: 'Success', data: null });
      }
      return res.json({ success: false, message: 'Unexpected response from upstream.', data: null });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'An internal error occurred.', data: null });
    }
  });

  /**
   * POST /total
   * Retrieves the total prayer count for the given month/day.
   */
  router.post('/total', async (req, res) => {
    const { month, day, apiKey } = req.body || {};
    if (!month || !day) {
      return res.status(400).json({ success: false, message: 'Invalid request.', data: null });
    }
    if (!apiUrl) {
      return res.status(500).json({ success: false, message: 'apiUrl is not configured.', data: null });
    }
    if (!apiKey && !clientId) {
      return res.status(500).json({ success: false, message: 'clientId is not configured.', data: null });
    }

    const id = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const headers = apiKey
      ? { 'yop-api-key': decrypt(encryptionKey, apiKey.iv, apiKey.encryptedData) }
      : { 'yop-client-application-id': clientId };

    try {
      const { data } = await axios.get(`${apiUrl}/prayers/${id}`, { headers });
      if (data && data.status === 'success') {
        return res.json({ success: true, message: 'Success', data: data.success.data });
      }
      return res.json({ success: false, message: 'No data found.', data: null });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'An internal error occurred.', data: null });
    }
  });

  return router;
}
