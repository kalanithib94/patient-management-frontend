<?php
/**
 * File: config.php
 * Purpose: Main configuration file for Eye-Docs KTP Demo application
 * Created: 2025-01-27 v1.0.0
 * Author: AI Development Team
 */

require_once __DIR__ . '/database_config_sqlite.php';

// Load Salesforce configuration
require_once __DIR__ . '/salesforce_config.php';

// Load environment variables
function loadEnvironment() {
    $envFile = __DIR__ . '/../../.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                list($key, $value) = explode('=', $line, 2);
                $_ENV[trim($key)] = trim($value, '"\'');
            }
        }
    }
}

loadEnvironment();

// Application Constants
define('APP_NAME', 'ReferralFlow Connect');
define('APP_VERSION', $_ENV['VERSION'] ?? '1.0.0');
define('DEBUG', ($_ENV['DEBUG'] ?? 'true') === 'true');
define('LOG_LEVEL', $_ENV['LOG_LEVEL'] ?? 'INFO');

// Database Configuration
define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'eyedocs_demo');
define('DB_USER', $_ENV['DB_USER'] ?? 'eyedocs_user');
define('DB_PASS', $_ENV['DB_PASS'] ?? 'EyeDocs2025!Demo');
define('DB_PORT', $_ENV['DB_PORT'] ?? 3306);

// API Configuration
define('API_BASE_URL', $_ENV['API_BASE_URL'] ?? 'http://localhost:8000/api');
define('FRONTEND_URL', $_ENV['FRONTEND_URL'] ?? 'http://localhost:3000');

// Salesforce Configuration - Defined in salesforce_config.php

// Security Configuration
define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? 'eyedocs-ktp-demo-jwt-secret-2025');
define('SESSION_TIMEOUT', 3600); // 1 hour
define('PASSWORD_MIN_LENGTH', 8);

// Feature Flags
define('ENABLE_ANALYTICS', ($_ENV['ENABLE_ANALYTICS'] ?? 'true') === 'true');
define('ENABLE_FORECASTING', ($_ENV['ENABLE_FORECASTING'] ?? 'true') === 'true');
define('DEMO_MODE', ($_ENV['DEMO_MODE'] ?? 'true') === 'true');

// File Paths
define('ROOT_PATH', dirname(__DIR__, 2));
define('LOGS_PATH', ROOT_PATH . '/logs');
define('UPLOADS_PATH', ROOT_PATH . '/uploads');
define('ANALYTICS_PATH', ROOT_PATH . '/analytics');

// Create necessary directories
$directories = [LOGS_PATH, UPLOADS_PATH];
foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Set timezone
date_default_timezone_set('Europe/London');

// Error reporting
if (DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ERROR | E_WARNING | E_PARSE);
    ini_set('display_errors', 0);
}

// CORS headers for API
function setCorsHeaders() {
    $allowedOrigins = [
        FRONTEND_URL,
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ];
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
}

// Utility functions
function logActivity($message, $level = 'INFO') {
    $logFile = LOGS_PATH . '/application.log';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

function generateApiResponse($status, $data = null, $message = null, $code = 200) {
    http_response_code($code);
    
    $response = [
        'status' => $status,
        'timestamp' => date('c'),
        'version' => APP_VERSION
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    if ($message !== null) {
        $response['message'] = $message;
    }
    
    return json_encode($response, JSON_PRETTY_PRINT);
}

function validateRequired($data, $required) {
    $missing = [];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missing[] = $field;
        }
    }
    return $missing;
}

function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

// Configuration class for complex settings
class AppConfig {
    private static $instance = null;
    private $config = [];
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->config = [
            'salesforce' => [
                'objects' => [
                    'optician' => $_ENV['SALESFORCE_OPTICIAN_OBJECT'] ?? 'Optician__c',
                    'referral' => $_ENV['SALESFORCE_REFERRAL_OBJECT'] ?? 'Referral__c',
                    'analytics' => $_ENV['SALESFORCE_ANALYTICS_OBJECT'] ?? 'Referral_Analytics__c'
                ],
                'api_version' => 'v58.0',
                'timeout' => 30,
                'retry_attempts' => 3
            ],
            'analytics' => [
                'python_path' => $_ENV['PYTHON_PATH'] ?? 'python',
                'output_dir' => $_ENV['ANALYTICS_OUTPUT_DIR'] ?? 'analytics/output/',
                'models_dir' => $_ENV['ANALYTICS_MODELS_DIR'] ?? 'analytics/models/',
                'forecast_periods' => 12,
                'confidence_threshold' => 0.80
            ]
        ];
    }
    
    public function get($key, $default = null) {
        $keys = explode('.', $key);
        $value = $this->config;
        
        foreach ($keys as $k) {
            if (!isset($value[$k])) {
                return $default;
            }
            $value = $value[$k];
        }
        
        return $value;
    }
}

// Global helper functions
function config($key, $default = null) {
    return AppConfig::getInstance()->get($key, $default);
}

// getDatabase function is now defined in database_config.php

// Initialize
setCorsHeaders();
logActivity('Application configuration loaded');
?>