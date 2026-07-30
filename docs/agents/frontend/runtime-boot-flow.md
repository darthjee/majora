## Runtime Boot Flow

1. `frontend/index.html` defines `<div id="root"></div>` and loads `/assets/js/main.jsx`.
2. `frontend/assets/js/main.jsx` imports Bootstrap CSS/JS and local CSS, then mounts `<App />`.
3. `frontend/assets/js/components/App.jsx` uses `AppController` to resolve the current hash route
   and render the matching page component.

