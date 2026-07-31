# Architecture

## Overview

Majora is structured as two independent applications — a Django REST backend and a React/Vite frontend — served together through the Tent proxy. This repository documents the architecture split by concern to keep agent contexts small.

This page is the hub. See the area pages for details:
- [Proxy](./architecture/proxy.md)
- [Frontend](./architecture/frontend.md)
- [Backend](./architecture/backend.md)
- [Shared volume / frontend build output](./architecture/shared-volume.md)
- [Product-owner agent & product definitions](./architecture/product-owner.md)
