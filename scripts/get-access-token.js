
const { GoogleAuth } = require('google-auth-library');
(async function(){
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      console.error('NO FIREBASE_SERVICE_ACCOUNT_JSON in environment');
      process.exit(2);
    }
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    const auth = new GoogleAuth({ credentials: parsed, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    console.log('SUCCESS token present:', !!token?.token);
    if (token?.res?.data) console.log('token info:', token.res.data);
    process.exit(0);
  } catch (e) {
    console.error('ERROR getting access token:', e && e.message ? e.message : e);
    if (e && e.stack) console.error(e.stack);
    process.exit(1);
  }
})();
