#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="file:./db/custom.db"
exec bun run dev
