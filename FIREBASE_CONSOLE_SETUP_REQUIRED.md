# 🔥 REQUIRED: Firebase Console Configuration

**Status:** ⚠️ **ACTION REQUIRED** - Manual steps needed before deployment

These configuration changes **MUST** be completed in the Firebase Console before the application can be safely deployed. Code fixes have been applied, but Firebase Console settings require manual configuration.

---

## Task 1: Enable Anonymous Authentication

**Priority:** 🔴 CRITICAL - BLOCKS DEPLOYMENT

**Why this is needed:**
The application uses `auth.signInAnonymously()` but this authentication method is currently disabled in your Firebase project, causing all authentication attempts to fail.

**Steps:**

1. Open [Firebase Console](https://console.firebase.google.com/project/business-bingo-2564e/authentication/providers)

2. Click on the **Authentication** section in the left sidebar

3. Navigate to the **Sign-in method** tab

4. Find **Anonymous** in the list of providers

5. Click on **Anonymous**

6. Toggle the **Enable** switch to ON

7. Click **Save**

**Verification:**
```javascript
// Open browser console on your app
firebase.auth().signInAnonymously()
  .then(user => console.log('✅ Auth successful:', user.uid))
  .catch(err => console.error('❌ Auth failed:', err));
```

Expected result: "✅ Auth successful" with a UID

---

## Task 2: Configure Firebase API Key Restrictions

**Priority:** 🔴 CRITICAL - BLOCKS DEPLOYMENT

**Why this is needed:**
Your Firebase API key is visible in client-side code (this is normal for Firebase), but it currently has NO RESTRICTIONS, meaning anyone can use it to access your Firebase services from anywhere.

**Current exposed key:** `AIzaSyB8UGPJfJY4cffA1uRs0PVgQMqdD4H-gr0`

### Steps:

#### A. Open Google Cloud Console

1. Go to [Google Cloud Console - API Credentials](https://console.cloud.google.com/apis/credentials?project=business-bingo-2564e)

2. You should see your API key in the list (it will start with `AIzaSyB8UGP...`)

3. Click the **Edit** button (pencil icon) next to the key

#### B. Set Application Restrictions

1. Under **Application restrictions**, select **HTTP referrers (web sites)**

2. Click **Add an item** and add these referrers:
   ```
   https://buzzword-bingo-ten.vercel.app/*
   https://*.vercel.app/*
   http://localhost:*
   http://127.0.0.1:*
   ```

3. These restrictions mean:
   - ✅ Your production Vercel deployment can use the key
   - ✅ Vercel preview deployments can use the key
   - ✅ Local development can use the key
   - ❌ Unauthorized websites CANNOT use the key
   - ❌ Direct API calls from curl/Postman CANNOT use the key

#### C. Set API Restrictions

1. Scroll down to **API restrictions**

2. Select **Restrict key**

3. Click **Select APIs** dropdown

4. Enable ONLY these APIs:
   - ✅ Firebase Realtime Database API
   - ✅ Firebase Installations API
   - ✅ Identity Toolkit API
   - ❌ Uncheck all others

5. Click **Save**

#### D. Verification

**Test 1: From your app (should work)**
```bash
# Open your app in browser, check console
# Should see: ✅ No CORS errors, app works normally
```

**Test 2: From unauthorized domain (should fail)**
```bash
# Try to access API from curl
curl -X GET "https://business-bingo-2564e-default-rtdb.firebaseio.com/.json?auth=AIzaSyB8UGPJfJY4cffA1uRs0PVgQMqdD4H-gr0"

# Expected result: 403 Forbidden or API key restriction error
```

---

## Post-Configuration Checklist

After completing both tasks above:

- [ ] Anonymous authentication is enabled
- [ ] API key restrictions are configured
- [ ] Test authentication works in browser console
- [ ] Test that app loads without errors
- [ ] Test that session creation works
- [ ] Test that joining sessions works
- [ ] Verify API key restrictions block unauthorized access

---

## What Happens If You Don't Do This?

### If Anonymous Auth is NOT enabled:
- ❌ All users get "Connection failed" errors
- ❌ No sessions can be created
- ❌ No sessions can be joined
- ❌ App is completely unusable

### If API Key Restrictions are NOT configured:
- ⚠️ Anyone can abuse your Firebase API key
- ⚠️ Attackers can create unlimited sessions
- ⚠️ Attackers can read all game data
- ⚠️ You could incur unexpected Firebase costs
- ⚠️ Your Firebase project could be suspended for abuse

---

## Timeline

**Estimated time:** 10-15 minutes total
- Task 1 (Anonymous Auth): 3-5 minutes
- Task 2 (API Key Restrictions): 7-10 minutes

**When to do this:** Before deploying the code fixes to production

---

## Need Help?

**Firebase Documentation:**
- [Anonymous Authentication](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [API Key Restrictions](https://cloud.google.com/docs/authentication/api-keys#api_key_restrictions)

**If you encounter issues:**
1. Verify you have Owner/Editor permissions on the Firebase project
2. Check that you're signed in with the correct Google account
3. Try in an incognito window if you have access to multiple Google accounts
4. Clear browser cache and reload Firebase Console

---

**Status:** ⏳ WAITING FOR MANUAL CONFIGURATION

Once these steps are complete, proceed with deploying the code fixes.
