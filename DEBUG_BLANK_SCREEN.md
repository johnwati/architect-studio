# Debugging Blank Screen

## Quick Fixes

### 1. **Hard Refresh Browser**
```
Mac: Cmd + Shift + R
Windows/Linux: Ctrl + Shift + R
```
Clears cache and reloads fresh code.

### 2. **Check Dev Server is Running**
```bash
# Check if server is running
curl http://localhost:5173

# Or check process
ps aux | grep vite
```

If not running, start it:
```bash
npm run dev
```

### 3. **Check Browser Console**
1. Open DevTools (F12)
2. Look for RED errors
3. Copy any error messages

### 4. **Verify Port**
Dev server might be on a different port. Check terminal output for:
```
  VITE ready in XXX ms
  
  ➜  Local:   http://localhost:5173/
```

### 5. **Check Network Tab**
1. Open DevTools → Network tab
2. Reload page
3. Look for failed requests (RED entries)

## Common Errors

### "Failed to fetch module"
- **Cause**: Build issue
- **Fix**: Stop server, run `npm run build`, restart dev server

### "Module not found"
- **Cause**: Import path wrong
- **Fix**: Check imports in console errors

### "IndexedDB error"
- **Cause**: Browser storage issue
- **Fix**: Clear browser data for localhost

### "Cannot read property..."
- **Cause**: Runtime error
- **Fix**: Check console for specific error

## Nuclear Option

If nothing works:

```bash
# Kill all processes
ps aux | grep -E "(vite|node)" | grep -v grep | awk '{print $2}' | xargs kill -9

# Clear build
rm -rf dist node_modules/.vite

# Reinstall (if needed)
npm install

# Rebuild
npm run build

# Start fresh
npm run dev
```

## What to Look For

### Good Signs ✅
- Console shows "IndexedDB initialized successfully"
- Network tab shows 200 status for all files
- No red errors in console
- HTML loads properly

### Bad Signs ❌
- Red errors in console
- Network requests failing
- "Failed to fetch" messages
- Module load errors

## Still Having Issues?

Share with me:
1. Browser console errors (all of them)
2. Network tab - any failed requests
3. Terminal output from `npm run dev`
4. Browser used (Chrome, Firefox, Safari)

---

**Most likely fix: Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)!** 🔄


