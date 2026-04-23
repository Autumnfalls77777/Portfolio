-- ============================================================
--  Portfolio Database Setup — Full Schema
--  Run this in phpMyAdmin on database: portfolio
-- ============================================================


-- ============================================================
-- 1. ADMINS
-- ============================================================
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'admin',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(255) DEFAULT '',
  `hero_title` VARCHAR(500) DEFAULT '',
  `hero_subtitle` VARCHAR(500) DEFAULT '',
  `about_text` TEXT,
  `profile_image` VARCHAR(500) DEFAULT '',
  `github` VARCHAR(500) DEFAULT '',
  `linkedin` VARCHAR(500) DEFAULT '',
  `resume_link` VARCHAR(500) DEFAULT '',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `tech_stack` VARCHAR(500) DEFAULT '',
  `category` VARCHAR(50) DEFAULT 'others',
  `image` VARCHAR(500) DEFAULT '',
  `github_link` VARCHAR(500) DEFAULT '',
  `live_link` VARCHAR(500) DEFAULT '',
  `featured` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4. CERTIFICATES
-- ============================================================
CREATE TABLE IF NOT EXISTS `certificates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `issuer` VARCHAR(255) DEFAULT '',
  `issue_date` DATE DEFAULT NULL,
  `image` VARCHAR(500) DEFAULT '',
  `category` VARCHAR(50) DEFAULT 'college',
  `credential_link` VARCHAR(500) DEFAULT '',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 5. SKILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS `skills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `skill_name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT '',
  `proficiency` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 6. CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `contacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(500) DEFAULT '',
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(45) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 7. SOCIAL_LINKS
-- ============================================================
CREATE TABLE IF NOT EXISTS `social_links` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `platform` VARCHAR(100) NOT NULL,
  `url` VARCHAR(500) DEFAULT '',
  `icon_class` VARCHAR(255) DEFAULT '',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 8. EXPERIENCE
-- ============================================================
CREATE TABLE IF NOT EXISTS `experience` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company` VARCHAR(255) NOT NULL,
  `role` VARCHAR(255) NOT NULL,
  `duration` VARCHAR(255) DEFAULT '',
  `description` TEXT,
  `location` VARCHAR(255) DEFAULT '',
  `is_current` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- DEFAULT DATA
-- ============================================================

-- Default settings row
INSERT INTO settings (id, full_name, hero_title, hero_subtitle, about_text, profile_image, github, linkedin, resume_link)
SELECT 1, 'Prabal Jaiswal',
       'Graphic Designer · Server Admin · Game Dev',
       'Crafting Digital Experiences with Code & Creativity',
       'Passionate creator building at the intersection of design, code, and gaming. Founder of Altitude SMP and Graphics Head for multiple projects.',
       '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);

-- Default social links
INSERT INTO social_links (platform, url, icon_class, is_active)
SELECT 'GitHub', 'https://github.com/Autumnfalls77777', 'fab fa-github', 1
WHERE NOT EXISTS (SELECT 1 FROM social_links WHERE platform = 'GitHub');

INSERT INTO social_links (platform, url, icon_class, is_active)
SELECT 'LinkedIn', '', 'fab fa-linkedin', 1
WHERE NOT EXISTS (SELECT 1 FROM social_links WHERE platform = 'LinkedIn');

INSERT INTO social_links (platform, url, icon_class, is_active)
SELECT 'Instagram', '', 'fab fa-instagram', 1
WHERE NOT EXISTS (SELECT 1 FROM social_links WHERE platform = 'Instagram');
