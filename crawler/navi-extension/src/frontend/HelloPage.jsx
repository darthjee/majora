import { useEffect, useState } from 'react';

export default function HelloPage () {
  const [hello, setHello] = useState(null);

  useEffect(() => {
    fetch('/ext/loot/hello.json')
      .then((r) => r.json())
      .then(setHello)
      .catch(() => setHello({ error: true }));
  }, []);

  if (!hello) return <p className="loot-hello-loading">Loading…</p>;
  if (hello.error) return <p className="loot-hello-error">Unavailable</p>;
  return <p className="loot-hello-status">{hello.extension}: {hello.status}</p>;
}
