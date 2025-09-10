<?php
/**
 * File: database_config_sqlite.php
 * Purpose: SQLite database configuration for Eye-Docs KTP Demo (temporary solution)
 * Created: 2025-01-27 v1.0.0
 * Author: AI Development Team
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
     * Load database configuration
     */
    private function loadConfig() {
        $this->config = [
            'db_path' => __DIR__ . '/../../database/eyedocs_demo.sqlite',
            'options' => [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        ];
    }
    
    /**
     * Establish database connection
     */
    private function connect() {
        try {
            $dbDir = dirname($this->config['db_path']);
            if (!is_dir($dbDir)) {
                mkdir($dbDir, 0755, true);
            }
            
            $this->connection = new PDO(
                'sqlite:' . $this->config['db_path'],
                null,
                null,
                $this->config['options']
            );
            
            // Enable foreign keys
            $this->connection->exec('PRAGMA foreign_keys = ON');
            
            $this->isConnected = true;
            $this->logActivity('database_connection', 'SQLite connection established successfully');
            
        } catch (Exception $e) {
            $this->isConnected = false;
            $this->logError("Database connection failed: " . $e->getMessage());
        }
    }
    
    /**
     * Get the PDO connection instance
     * @return PDO
     */
    public function getConnection() {
        if (!$this->isConnected || $this->connection === null) {
            $this->connect();
        }
        return $this->connection;
    }
    
    /**
     * Test database connection and return status
     * @return array Connection status information
     */
    public function testConnection() {
        try {
            $connection = $this->getConnection();
            $stmt = $connection->query('SELECT sqlite_version() as version, datetime("now") as current_time');
            $result = $stmt->fetch();
            
            return [
                'status' => 'success',
                'message' => 'SQLite database connection successful',
                'connection_info' => [
                    'version' => $result['version'],
                    'current_time' => $result['current_time'],
                    'database_name' => 'eyedocs_demo.sqlite'
                ],
                'tables' => $this->getTableStatus(),
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
            $stmt = $connection->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
            $tables = [];
            while ($row = $stmt->fetch()) {
                $tables[] = $row['name'];
            }
            return $tables;
        } catch (Exception $e) {
            return [];
        }
    }
    
    /**
     * Get database configuration
     * @return array
     */
    public function getConfig() {
        return [
            'type' => 'sqlite',
            'path' => $this->config['db_path']
        ];
    }
    
    /**
     * Log database activity
     */
    private function logActivity($action, $description) {
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
     */
    private function logError($message) {
        $this->logActivity('ERROR', $message);
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
?>
