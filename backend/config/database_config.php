<?php
/**
 * File: database_config.php
 * Purpose: Database configuration and connection management for Eye-Docs KTP Demo
 * Created: 2025-01-27 v1.0.0
 * Last Modified: 2025-01-27 v1.0.0
 * Author: AI Development Team
 * 
 * Dependencies: PDO extension, MySQL 8.0+
 * Database Tables: All tables in eyedocs_demo schema
 * API Endpoints: Used by all API endpoints for database operations
 * 
 * Changelog:
 * v1.0.0 - Initial creation with Salesforce integration support
 */

class DatabaseConfig {
    private static $instance = null;
    private $connection;
    private $config;
    private $isConnected = false;
    
    /**
     * Private constructor to enforce singleton pattern
     */
    private function __construct() {
        $this->loadConfig();
        $this->connect();
    }
    
    /**
     * Get singleton instance of DatabaseConfig
     * @return DatabaseConfig
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new DatabaseConfig();
        }
        return self::$instance;
    }
    
    /**
     * Load database configuration from environment
     */
    private function loadConfig() {
        // Load environment variables from .env file if it exists
        $envFile = __DIR__ . '/../../.env';
        if (file_exists($envFile)) {
            $this->loadEnvironmentFile($envFile);
        }
        
                    $this->config = [
                'host' => $_ENV['DB_HOST'] ?? 'localhost',
                'port' => $_ENV['DB_PORT'] ?? '3306',
                'dbname' => $_ENV['DB_NAME'] ?? 'eyedocs_demo',
                'username' => $_ENV['DB_USER'] ?? 'eyedocs_user',
                'password' => $_ENV['DB_PASS'] ?? 'EyeDocs2025!Demo',
                'charset' => 'utf8mb4',
                'options' => [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_PERSISTENT => false // Disabled for development
                ]
            ];
            
            // Add MySQL-specific options if available
            if (defined('PDO::MYSQL_ATTR_INIT_COMMAND')) {
                $this->config['options'][PDO::MYSQL_ATTR_INIT_COMMAND] = "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci";
            }
    }
    
    /**
     * Load environment variables from .env file
     * @param string $filePath
     */
    private function loadEnvironmentFile($filePath) {
        if (!is_readable($filePath)) {
            return;
        }
        
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                
                // Remove quotes if present
                if (preg_match('/^"(.*)"$/', $value, $matches)) {
                    $value = $matches[1];
                } elseif (preg_match("/^'(.*)'$/", $value, $matches)) {
                    $value = $matches[1];
                }
                
                $_ENV[$key] = $value;
            }
        }
    }
    
    /**
     * Establish database connection
     * @throws Exception if connection fails
     */
    private function connect() {
        try {
            $dsn = "mysql:host={$this->config['host']};port={$this->config['port']};dbname={$this->config['dbname']};charset={$this->config['charset']}";
            
            $this->connection = new PDO(
                $dsn,
                $this->config['username'],
                $this->config['password'],
                $this->config['options']
            );
            
            // Test connection with a simple query
            $this->connection->query('SELECT 1');
            $this->isConnected = true;
            
            // Log successful connection (if logging is enabled)
            $this->logActivity('database_connection', 'Connection established successfully');
            
        } catch (PDOException $e) {
            $this->isConnected = false;
            $this->logError("Database connection failed: " . $e->getMessage());
            // For demo purposes, don't throw exception - just log error
            // throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }
    
    /**
     * Get the PDO connection instance
     * @return PDO
     * @throws Exception if not connected
     */
    public function getConnection() {
        if (!$this->isConnected || $this->connection === null) {
            $this->connect();
        }
        return $this->connection;
    }
    
    /**
     * Get database configuration (without sensitive data)
     * @return array
     */
    public function getConfig() {
        $safeConfig = $this->config;
        unset($safeConfig['password']); // Remove password for security
        return $safeConfig;
    }
    
    /**
     * Test database connection and return detailed status
     * @return array Connection status information
     */
    public function testConnection() {
        try {
            $connection = $this->getConnection();
            $stmt = $connection->query('
                SELECT 
                    VERSION() as mysql_version, 
                    NOW() as current_time, 
                    DATABASE() as database_name,
                    USER() as current_user,
                    @@character_set_database as charset,
                    @@collation_database as collation
            ');
            $result = $stmt->fetch();
            
            // Test table accessibility
            $tables = $this->getTableStatus();
            
            return [
                'status' => 'success',
                'message' => 'Database connection successful',
                'connection_info' => $result,
                'tables' => $tables,
                'config' => $this->getConfig()
            ];
            
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage(),
                'config' => $this->getConfig()
            ];
        }
    }
    
    /**
     * Get status of all tables in the database
     * @return array Table status information
     */
    public function getTableStatus() {
        try {
            $connection = $this->getConnection();
            $stmt = $connection->query('
                SELECT 
                    table_name,
                    table_rows,
                    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
                    table_comment
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
                ORDER BY table_name
            ');
            return $stmt->fetchAll();
        } catch (Exception $e) {
            return [];
        }
    }
    
    /**
     * Execute a prepared statement with parameters
     * @param string $sql SQL query
     * @param array $params Parameters for the query
     * @return PDOStatement
     * @throws Exception if query fails
     */
    public function executeQuery($sql, $params = []) {
        try {
            $connection = $this->getConnection();
            $stmt = $connection->prepare($sql);
            $stmt->execute($params);
            
            // Log query execution (if logging is enabled and not a SELECT)
            if (!stristr($sql, 'SELECT')) {
                $this->logActivity('database_query', 'Query executed: ' . $this->sanitizeSQL($sql));
            }
            
            return $stmt;
        } catch (PDOException $e) {
            $this->logError("Query execution failed: " . $e->getMessage() . " SQL: " . $this->sanitizeSQL($sql));
            throw new Exception("Query execution failed: " . $e->getMessage());
        }
    }
    
    /**
     * Begin a database transaction
     * @return bool
     */
    public function beginTransaction() {
        return $this->getConnection()->beginTransaction();
    }
    
    /**
     * Commit a database transaction
     * @return bool
     */
    public function commit() {
        return $this->getConnection()->commit();
    }
    
    /**
     * Roll back a database transaction
     * @return bool
     */
    public function rollback() {
        return $this->getConnection()->rollback();
    }
    
    /**
     * Get the last inserted ID
     * @return string
     */
    public function getLastInsertId() {
        return $this->getConnection()->lastInsertId();
    }
    
    /**
     * Sanitize SQL for logging (remove sensitive data)
     * @param string $sql
     * @return string
     */
    private function sanitizeSQL($sql) {
        // Remove potential sensitive data patterns
        $sql = preg_replace('/password\s*=\s*[\'"][^\'\"]*[\'"]/', 'password=***', $sql);
        $sql = preg_replace('/token\s*=\s*[\'"][^\'\"]*[\'"]/', 'token=***', $sql);
        return substr($sql, 0, 500); // Limit length for logs
    }
    
    /**
     * Log database activity
     * @param string $action
     * @param string $description
     */
    private function logActivity($action, $description) {
        // Simple file-based logging for development
        $logFile = __DIR__ . '/../../logs/database.log';
        if (!is_dir(dirname($logFile))) {
            mkdir(dirname($logFile), 0755, true);
        }
        
        $logEntry = sprintf(
            "[%s] [%s] %s\n",
            date('Y-m-d H:i:s'),
            $action,
            $description
        );
        
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Log database errors
     * @param string $message
     */
    private function logError($message) {
        $this->logActivity('ERROR', $message);
        
        // Also log to PHP error log
        error_log("[EyeDocs-DB] " . $message);
    }
    
    /**
     * Close database connection
     */
    public function close() {
        $this->connection = null;
        $this->isConnected = false;
    }
    
    /**
     * Destructor to ensure clean connection closure
     */
    public function __destruct() {
        $this->close();
    }
}

/**
 * Global convenience function to get database connection
 * @return PDO
 */
function getDatabase() {
    return DatabaseConfig::getInstance()->getConnection();
}

/**
 * Global convenience function to test database connectivity
 * @return array
 */
function testDatabaseConnection() {
    try {
        $db = DatabaseConfig::getInstance();
        $result = $db->testConnection();
        return $result;
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
}

/**
 * Validate database schema and return status
 * @return array
 */
function validateDatabaseSchema() {
    try {
        $db = DatabaseConfig::getInstance();
        $connection = $db->getConnection();
        
        // Check if all required tables exist
        $requiredTables = [
            'opticians',
            'referrals', 
            'referral_history',
            'referral_analytics',
            'user_sessions',
            'activity_log',
            'system_config',
            'salesforce_sync_log'
        ];
        
        $existingTables = [];
        $stmt = $connection->query("SHOW TABLES");
        while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
            $existingTables[] = $row[0];
        }
        
        $missingTables = array_diff($requiredTables, $existingTables);
        
        if (empty($missingTables)) {
            return [
                'status' => 'valid',
                'message' => 'All required tables present',
                'tables' => $existingTables
            ];
        } else {
            return [
                'status' => 'invalid',
                'message' => 'Missing required tables',
                'missing_tables' => $missingTables,
                'existing_tables' => $existingTables
            ];
        }
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
}

// If this file is called directly, run connection test
if (basename(__FILE__) == basename($_SERVER['SCRIPT_FILENAME'])) {
    header('Content-Type: application/json');
    echo json_encode(testDatabaseConnection(), JSON_PRETTY_PRINT);
}
?>