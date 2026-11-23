import express from 'express';
import {
  type AllowedModel,
  type AssistantPersona,
  type GroundingMode,
  runMapsGroundedBrief,
  runSearchGroundedBrief,
  runSpentaChat,
} from '../server/gemini.js';

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get(['/api', '/api/health'], (_req, res) => {
  res.json({
    status: 'ok',
    platform: 'Spenta Sovereign OS',
    runtime: 'vercel-serverless',
  });
});

app.post('/api/gemini/chat', async (req, res) => {
  try {
    const body = req.body || {};
    const persona: AssistantPersona =
      body.persona === 'investor' || body.persona === 'market' ? body.persona : 'architect';
    const model: AllowedModel =
      body.model === 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';
    const groundingMode: GroundingMode | undefined =
      body.groundingMode === 'maps' ||
      body.groundingMode === 'search' ||
      body.groundingMode === 'none'
        ? body.groundingMode
        : undefined;

    const result = await runSpentaChat({
      messages: Array.isArray(body.messages) ? body.messages : [],
      persona,
      model,
      useSearchGrounding: Boolean(body.useSearchGrounding),
      groundingMode,
      latLng:
        body.latLng &&
        typeof body.latLng.latitude === 'number' &&
        typeof body.latLng.longitude === 'number'
          ? { latitude: body.latLng.latitude, longitude: body.latLng.longitude }
          : undefined,
      stackSummary: typeof body.stackSummary === 'string' ? body.stackSummary : undefined,
    });

    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate Gemini response.';
    const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
    return res.status(status).json({ error: message });
  }
});

app.post('/api/gemini/search-grounding', async (req, res) => {
  try {
    const body = req.body || {};
    const query = typeof body.query === 'string' ? body.query : '';
    const rawCtx = body.context && typeof body.context === 'object' ? body.context : undefined;
    const context = rawCtx
      ? {
          productName: typeof rawCtx.productName === 'string' ? rawCtx.productName : undefined,
          scenarioLabel:
            typeof rawCtx.scenarioLabel === 'string' ? rawCtx.scenarioLabel : undefined,
          modeledRoiPct:
            typeof rawCtx.modeledRoiPct === 'number' && Number.isFinite(rawCtx.modeledRoiPct)
              ? rawCtx.modeledRoiPct
              : undefined,
          paybackMonths:
            typeof rawCtx.paybackMonths === 'number' && Number.isFinite(rawCtx.paybackMonths)
              ? rawCtx.paybackMonths
              : undefined,
          spentaThreeYrTcoUsd:
            typeof rawCtx.spentaThreeYrTcoUsd === 'number' &&
            Number.isFinite(rawCtx.spentaThreeYrTcoUsd)
              ? rawCtx.spentaThreeYrTcoUsd
              : undefined,
          westernThreeYrTcoUsd:
            typeof rawCtx.westernThreeYrTcoUsd === 'number' &&
            Number.isFinite(rawCtx.westernThreeYrTcoUsd)
              ? rawCtx.westernThreeYrTcoUsd
              : undefined,
        }
      : undefined;
    const result = await runSearchGroundedBrief(query, context);
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search grounding request failed.';
    const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
    return res.status(status).json({ error: message });
  }
});

app.post('/api/gemini/maps-grounding', async (req, res) => {
  try {
    const body = req.body || {};
    const query = typeof body.query === 'string' ? body.query : '';
    const hubLabel = typeof body.hubLabel === 'string' ? body.hubLabel : undefined;
    const latLng =
      body.latLng &&
      typeof body.latLng.latitude === 'number' &&
      typeof body.latLng.longitude === 'number'
        ? { latitude: body.latLng.latitude, longitude: body.latLng.longitude }
        : undefined;
    const result = await runMapsGroundedBrief(query, latLng, hubLabel);
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Maps grounding request failed.';
    const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
    return res.status(status).json({ error: message });
  }
});

export default app;
