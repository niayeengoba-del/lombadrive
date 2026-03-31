

# Lomba Virtual Drive — Implementation Plan

## Overview
A luxurious dark-mode virtual file storage app with 30GB capacity, featuring gold and emerald green accents in a fintech style. Files are stored via Supabase Storage with a simple PIN-based login screen.

## Pages & Features

### 1. PIN Login Screen
- Dark, elegant full-screen login with a single password field
- Gold-accented "Entrer" button — PIN stored securely (hashed in Supabase)
- Session persists via localStorage until logout

### 2. Storage Dashboard (Main Page)
- **Header**: "Lomba Virtual Drive" logo with emerald/gold styling
- **Storage Progress Bar**: Animated gold bar showing used vs. remaining space out of 30GB, with real-time numbers
- **Quick Stats Cards**: Total files, used space, remaining space — with gold/emerald icons

### 3. File Management
- **Upload Area**: Large drag-and-drop zone + file picker button labeled "Nabde" (Upload in Pulaar)
- **File List**: Sorted by size (largest first), showing file name, size, type, and upload date
- **File Actions**: Download ("Jippinde") and Delete buttons per file
- **File Type Icons**: Different icons for Videos, Documents, Apps/Archives
- **Success Notification**: Toast message "Diarrama ! Fichier sécurisé." on successful upload

### 4. Cultural & UX Details
- Pulaar translations on main action buttons (Nabde = Upload, Jippinde = Download)
- All notifications in the cultural style specified
- Dark mode with `#0a0a0a` background, gold (`#d4a742`) and emerald (`#10b981`) accents

## Backend (Supabase)
- Supabase Storage bucket for files (30GB limit enforced client-side with server validation)
- Edge function to verify PIN login
- Database table to track file metadata and calculate total storage used
- RLS policies to secure file access

