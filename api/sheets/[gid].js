const { google } = require('googleapis');

module.exports = async function handler(req, res) {
  const { gid } = req.query;

  if (!gid) {
    return res.status(400).json({ error: 'gid parameter is required' });
  }

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!spreadsheetId || !serviceAccountJson) {
    return res.status(500).json({ error: 'Google Sheets not configured' });
  }

  try {
    const credentials = JSON.parse(serviceAccountJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties',
    });

    const sheet = meta.data.sheets.find(
      (s) => String(s.properties.sheetId) === String(gid)
    );

    if (!sheet) {
      return res.status(404).json({ error: 'Sheet with gid=' + gid + ' not found' });
    }

    const sheetName = sheet.properties.title;

    const data = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    const rows = data.data.values || [];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell != null ? cell : '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
          })
          .join(',')
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Google Sheets API error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch sheet data' });
  }
};
