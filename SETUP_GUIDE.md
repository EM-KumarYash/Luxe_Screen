# Luxe Screens: Setup Guide

This guide takes you from a fresh laptop to the website running on your machine, step by step. No prior experience with this project is needed.

**Time needed:** about 20–30 minutes (most of it is installing software).

---

## Contents

1. [What you will set up](#1-what-you-will-set-up)
2. [Install the required software](#2-install-the-required-software)
3. [Download the project](#3-download-the-project)
4. [Install the project's packages](#4-install-the-projects-packages)
5. [Create the database](#5-create-the-database) (choose **Option A** or **Option B**)
6. [Create the settings file (.env.local)](#6-create-the-settings-file-envlocal)
7. [Create the tables and load sample data](#7-create-the-tables-and-load-sample-data)
8. [Run the website](#8-run-the-website)
9. [Check everything works](#9-check-everything-works)
10. [Everyday commands](#10-everyday-commands)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. What you will set up

| Part                 | What it is                                                     |
| -------------------- | -------------------------------------------------------------- |
| **Node.js**          | Runs the website (frontend and backend are one Next.js app)    |
| **PostgreSQL**       | The database that stores theatres, bookings, coupons and so on |
| **The project code** | Downloaded from GitHub                                         |

You only need **one** way of running PostgreSQL:

- **Option A: Docker.** Easiest. One command starts a ready-made database.
- **Option B: PostgreSQL installed directly** on your laptop.

---

## 2. Install the required software

### 2.1 Node.js (required)

1. Go to <https://nodejs.org> and download the **LTS** version (v20.19 or newer).
2. Install it with the default options.
3. Open a **new** terminal and check:
   ```bash
   node --version    # should print v20.19.x or higher
   npm --version
   ```

### 2.2 Git (required)

1. Download from <https://git-scm.com/downloads> and install with default options.
2. Check:
   ```bash
   git --version
   ```

### 2.3 A database: pick ONE

- **Option A:** install **Docker Desktop** from <https://www.docker.com/products/docker-desktop>, then open it and wait until it says _"Engine running"_.
- **Option B:** install **PostgreSQL**. Full steps are in [section 5, Option B](#option-b-installed-postgresql).

> **Which terminal?**
> Windows: use **Git Bash**, **PowerShell** or the terminal inside **VS Code**.
> Mac: use **Terminal**. Linux: any terminal.

---

## 3. Download the project

```bash
git clone https://github.com/<owner-username>/luxe-screens.git
cd luxe-screens
```

Replace `<owner-username>` with the GitHub username of the person who shared the project. If the repository is private, they must first add you as a collaborator.

> Every command from now on must be run **inside the `luxe-screens` folder**.

---

## 4. Install the project's packages

```bash
npm install
```

This downloads all libraries. It takes 1–3 minutes and also prepares the database client automatically. Warnings in yellow are normal; red **errors** are not (see [Troubleshooting](#11-troubleshooting)).

---

## 5. Create the database

### Option A: Docker

Make sure Docker Desktop is open and running, then:

```bash
docker compose up -d
```

This starts PostgreSQL 17 in the background with:

| Setting  | Value                                  |
| -------- | -------------------------------------- |
| Host     | `localhost`                            |
| Port     | `5432`                                 |
| Username | `postgres`                             |
| Password | `postgres`                             |
| Database | `luxe_screens` (created automatically) |

Check that it's running:

```bash
docker compose ps     # STATUS should show "running" / "healthy"
```

✅ Done. Go to [step 6](#6-create-the-settings-file-envlocal).

> **Note:** if PostgreSQL is _also_ installed on your laptop, both use port 5432 and will clash. Stop one of them, or use Option B instead.

---

### Option B: Installed PostgreSQL

#### B1. Install PostgreSQL

**Windows**

1. Download the installer from <https://www.postgresql.org/download/windows/> (version 14 or newer; 17 recommended).
2. Run it and keep the defaults. When asked:
   - **Password for the `postgres` user:** choose one and **write it down**. You will need it in step 6.
   - **Port:** keep `5432`.
   - Keep **pgAdmin 4** and **Command Line Tools** ticked.
3. Finish the installation. PostgreSQL now runs automatically in the background.

**Mac** (with [Homebrew](https://brew.sh))

```bash
brew install postgresql@17
brew services start postgresql@17
```

On Mac, the default user is **your Mac username with no password**. You can either use that in step 6, or set a password for `postgres` (see B3).

**Linux (Ubuntu/Debian)**

```bash
sudo apt update
sudo apt install postgresql
sudo systemctl start postgresql
```

#### B2. Create the database: way 1, pgAdmin (visual, Windows/Mac)

1. Open **pgAdmin 4** from the Start menu or Applications.
2. In the left panel, expand **Servers → PostgreSQL 17**. Enter the password you set during install.
3. Right-click **Databases → Create → Database…**
4. In **Database**, type exactly: `luxe_screens`
5. Click **Save**.

✅ You should now see `luxe_screens` under **Databases**.

#### B2. Create the database: way 2, command line

**Windows**

Open **SQL Shell (psql)** from the Start menu and press **Enter** to accept each default (Server, Database, Port, Username) until it asks for the **password**, then type it. (The password is not shown while typing; that's normal.)

You'll see a prompt like `postgres=#`. Type:

```sql
CREATE DATABASE luxe_screens;
```

You should see `CREATE DATABASE`. Type `\q` to exit.

> Prefer a normal terminal? Run `psql -U postgres -h localhost`. If it says _psql is not recognized_, use the full path instead:
> `"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost`

**Mac**

```bash
createdb luxe_screens
```

**Linux**

```bash
sudo -u postgres psql -c "CREATE DATABASE luxe_screens;"
```

#### B3. (Linux, optional on Mac) Set a password for the `postgres` user

```bash
# Linux
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# Mac
psql postgres -c "CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';"
```

#### B4. Check the database exists

```bash
psql -U postgres -h localhost -c "\l"
```

`luxe_screens` should appear in the list.

---

## 6. Create the settings file (.env.local)

The project needs to know how to connect to your database. Copy the example file:

```bash
# Mac / Linux / Git Bash
cp .env.example .env.local

# Windows PowerShell
Copy-Item .env.example .env.local

# Windows Command Prompt
copy .env.example .env.local
```

Open `.env.local` in any editor. It looks like this:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/luxe_screens?schema=public"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

The `DATABASE_URL` format is:

```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public
```

| Your setup                           | What to change                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| **Option A (Docker)**                | Nothing. It already matches.                                                       |
| **Option B, Windows/Linux**          | Replace the **second** `postgres` (the password) with **your** PostgreSQL password |
| **Option B, Mac without a password** | `postgresql://YOUR_MAC_USERNAME@localhost:5432/luxe_screens?schema=public`         |

**Example:** if your password is `root`:

```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/luxe_screens?schema=public"
```

> **Password has special characters** like `@ # % / :`? Replace them with their URL codes, for example `@` → `%40`, `#` → `%23`, `%` → `%25`. So `my@pass` becomes `my%40pass`.

> `.env.local` contains your password, so it is **never uploaded to GitHub** (git ignores it).

---

## 7. Create the tables and load sample data

```bash
npm run db:deploy
```

✅ Expected: `All migrations have been successfully applied.`

```bash
npm run db:seed
```

✅ Expected:

```
Seed complete: {
  locations: 5,
  theaters: 6,
  slots: 24,
  addOns: 12,
  addOnOptions: 23,
  coupons: 4
}
```

Your database now has all tables, plus sample theatres, time slots, cakes, decor, gifts and coupons. Running the seed again is safe; it won't create duplicates.

---

## 8. Run the website

```bash
npm run dev
```

Wait for:

```
▲ Next.js 16.x (Turbopack)
- Local:   http://localhost:3000
✓ Ready
```

Open the **Local** link in your browser.

> If port 3000 is busy, Next.js automatically uses the next free port (3001, 3002, …). **Use the exact URL shown in the terminal.**

To stop the website, press `Ctrl + C` in the terminal.

---

## 9. Check everything works

| Check               | How                                               | Expected                                                  |
| ------------------- | ------------------------------------------------- | --------------------------------------------------------- |
| Database connection | Open `http://localhost:3000/api/health`           | `{"status":"ok","database":"up"}`                         |
| Home page           | Open `http://localhost:3000`                      | Slideshow, services, theatres, FAQ                        |
| Gallery             | Click **Theatres**                                | 6 theatres; search and filters work                       |
| AI Planner          | Click **AI Planner**, then **Plan my experience** | A recommended theatre and package                         |
| Booking             | Click **Book Now** and complete all 9 steps       | "Booking confirmed!" with a reference like `LXS-AB12CD34` |
| Waitlist            | Click **New Locations** and submit the form       | "You're on the list!"                                     |

**Test coupons:** `LUXE10`, `FIRSTSHOW`, `CELEBRATE20` (valid) · `MONSOON25` (expired, to see the error).

**Payment is simulated:** no real money and no card details. Tick _"Test mode: simulate a declined payment"_ to try the failure path.

### See the saved data

```bash
npm run db:studio
```

This opens a browser page where you can browse every table: `Booking`, `CartItem`, `WaitlistEntry`, `ContactMessage` and so on. You can also use pgAdmin: **luxe_screens → Schemas → public → Tables**, then right-click a table → **View/Edit Data → All Rows**.

---

## 10. Everyday commands

After the first setup, you only need:

```bash
# (Option A only) start the database if Docker was restarted
docker compose up -d

npm run dev
```

| Command                          | What it does                                       |
| -------------------------------- | -------------------------------------------------- |
| `npm run dev`                    | Start the website in development mode              |
| `npm run build` then `npm start` | Build and run the production version               |
| `npm test`                       | Run the unit tests                                 |
| `npm run db:studio`              | Browse the database in your browser                |
| `npm run db:seed`                | Reload the sample data                             |
| `npm run db:reset`               | ⚠️ Delete **all** data, recreate tables and reseed |
| `docker compose down`            | Stop the Docker database (data is kept)            |
| `docker compose down -v`         | ⚠️ Stop it **and delete** all its data             |

### Getting the latest code later

```bash
git pull
npm install
npm run db:deploy     # applies any new database changes
npm run dev
```

---

## 11. Troubleshooting

| Problem / error message                                                    | Cause                                                     | Fix                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node` / `npm` / `git` _is not recognized_                                 | Software not installed, or terminal opened before install | Install it, then **close and reopen** the terminal                                                                                                                                                                                                         |
| `DATABASE_URL is not set` / `Environment variable not found: DATABASE_URL` | `.env.local` missing or in the wrong folder               | Do [step 6](#6-create-the-settings-file-envlocal) inside the `luxe-screens` folder                                                                                                                                                                         |
| `password authentication failed for user "postgres"`                       | Wrong password in `.env.local`                            | Fix the password in `DATABASE_URL` (see the special-characters note in step 6)                                                                                                                                                                             |
| `Can't reach database server at localhost:5432`                            | PostgreSQL / Docker isn't running                         | **Docker:** open Docker Desktop, run `docker compose up -d`. **Windows:** press `Win + R`, type `services.msc`, find **postgresql-x64-17** and click **Start**. **Mac:** `brew services start postgresql@17`. **Linux:** `sudo systemctl start postgresql` |
| `database "luxe_screens" does not exist`                                   | Database not created                                      | Do [step 5](#5-create-the-database)                                                                                                                                                                                                                        |
| `port 5432 is already allocated` (Docker)                                  | Installed PostgreSQL is already using 5432                | Stop the installed PostgreSQL service, or use Option B                                                                                                                                                                                                     |
| `Port 3000 is in use`                                                      | Another app uses 3000                                     | Nothing to do: use the URL the terminal prints (e.g. `:3001`)                                                                                                                                                                                              |
| `psql` _is not recognized_ (Windows)                                       | PostgreSQL's `bin` folder isn't on PATH                   | Use **SQL Shell (psql)** from the Start menu, or the full path `"C:\Program Files\PostgreSQL\17\bin\psql.exe"`                                                                                                                                             |
| Pages load but show no theatres                                            | Sample data not loaded                                    | Run `npm run db:seed`                                                                                                                                                                                                                                      |
| `npm install` fails with `EACCES` / permission errors                      | Folder permissions                                        | Don't use `sudo`; clone the project into your user folder (e.g. Desktop or Documents)                                                                                                                                                                      |
| Something is stuck or behaves oddly                                        | Stale build cache                                         | Stop the server, delete the `.next` folder, run `npm run dev` again                                                                                                                                                                                        |

Still stuck? Copy the **full error message** from the terminal and send it to the person who shared the project.
