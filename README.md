# Farm Inspection Tool (React + Vite + Supabase)

A fully responsive, production-ready React + Vite application migrated from the monolithic HTML setup. Features offline draft saving, dynamic 10-language translations, RTL/LTR layout toggling, WCAG 2.1 AA accessibility standards, high-quality printing styles, and rich interactive dashboards.

## Features

- **Offline Draft Autosave**: Save inspection drafts automatically in client IndexedDB.
- **Supabase Integration**: Live record synchronization and realtime status changes.
- **RTL & Multilingual**: Complete UI and criteria translation for 10 languages (Arabic, English, Simplified Chinese, Spanish, Hindi, French, Portuguese, Russian, German, Japanese).
- **A11y Compliant**: Focus trapping modals, logical screen reader tab indexes, and high contrast layout.
- **Printing**: Clean print stylesheets scaled and formatted specifically for landscape tables.
- **Analytics Dashboard**: Interactive charts tracking scores, average metrics, and status distributions.

## How to Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory and specify:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```
