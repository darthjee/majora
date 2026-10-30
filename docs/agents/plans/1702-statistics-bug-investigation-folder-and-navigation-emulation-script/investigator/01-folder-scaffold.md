# Folder scaffold and standalone compose

Create the investigation folder and the container that runs the scripts.

- `docker-compose.yml`: one service (e.g. `emulate`) on a pinned Python image, mounting the
  folder, running `python emulate.py`. It joins the project's existing Docker network as an
  external network so it can reach the proxy (`majora_proxy`) and the backend (`majora_app`
  service on port 8080) by name. Find the network name from the root `docker-compose.yml` /
  `docker network ls` and document it; make it overridable through an environment variable in
  case the project folder name differs.
- Secrets: pass `PROXY_SECRET` and `STATISTICS_SKIP_SECRET` through `env_file` pointing at the
  root `.env` (or the environment). Never copy their values into the folder.
- Dependencies: standard library only if practical (`urllib`, `http.cookiejar`,
  `concurrent.futures`), otherwise a pinned `requirements.txt` installed in the container.
- `.gitignore`: ignore `reports/` and any other generated output.
- `README.md`: purpose (link to Epic #1696 and the specs), prerequisites (local stack up, a
  local staff user to approve the device authorization), how to run, the warning not to browse
  the local site during a run, where the refresh-burst list came from (filled in by step 03),
  and that the folder is deleted once the bug is fixed.

## Files to Change

- `investigations/statistics-bug/docker-compose.yml` — standalone runner service.
- `investigations/statistics-bug/.gitignore` — generated reports.
- `investigations/statistics-bug/README.md` — how to run, warnings.
