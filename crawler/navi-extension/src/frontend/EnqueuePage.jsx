import { useState } from 'react';
import './EnqueuePage.css';

export default function EnqueuePage () {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null); // { status: 'enqueued', slug, namespace } | { error: string } | null
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/ext/lootstudios/enqueue.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        setResult(body);
      } else {
        setResult({ error: body.error || 'Enqueue failed' });
      }
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="loot-enqueue-form" onSubmit={handleSubmit}>
      <label htmlFor="loot-enqueue-url">Collection URL</label>
      <input
        id="loot-enqueue-url"
        type="text"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://app.lootstudios.com/bundle/<slug>/"
      />
      <button type="submit" disabled={submitting}>Enqueue</button>

      {result && !result.error && (
        <p className="loot-enqueue-confirmation">
          Enqueued {result.slug} (namespace {result.namespace})
        </p>
      )}
      {result && result.error && (
        <p className="loot-enqueue-error">{result.error}</p>
      )}
    </form>
  );
}
