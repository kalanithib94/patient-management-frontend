<?php
/**
 * File: init_database.php
 * Purpose: Initialize SQLite database with schema and sample data
 * Created: 2025-01-27 v1.0.0
 * Author: AI Development Team
 */

require_once __DIR__ . '/config/config.php';

echo "Initializing Eye-Docs KTP Demo Database...\n";
echo "==========================================\n\n";

try {
    // Get database connection
    $db = DatabaseConfig::getInstance();
    $connection = $db->getConnection();
    
    echo "✅ Database connection established\n";
    
    // Read and execute SQLite schema
    $schemaFile = __DIR__ . '/../database/schema/sqlite_schema.sql';
    if (file_exists($schemaFile)) {
        $sql = file_get_contents($schemaFile);
        
        // Split SQL into individual statements
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        
        echo "📋 Executing database schema...\n";
        
        foreach ($statements as $statement) {
            if (!empty($statement)) {
                try {
                    $connection->exec($statement);
                    echo "  ✅ Executed: " . substr($statement, 0, 50) . "...\n";
                } catch (Exception $e) {
                    echo "  ⚠️  Warning: " . $e->getMessage() . "\n";
                }
            }
        }
        
        echo "\n✅ Database schema created successfully\n";
        
        // Verify tables were created
        $tables = $db->getTableStatus();
        echo "\n📊 Database tables:\n";
        foreach ($tables as $table) {
            echo "  - $table\n";
        }
        
        // Test some basic queries
        echo "\n🧪 Testing basic functionality...\n";
        
        // Count opticians
        $stmt = $connection->query("SELECT COUNT(*) as count FROM opticians");
        $opticianCount = $stmt->fetch()['count'];
        echo "  ✅ Opticians: $opticianCount\n";
        
        // Count referrals
        $stmt = $connection->query("SELECT COUNT(*) as count FROM referrals");
        $referralCount = $stmt->fetch()['count'];
        echo "  ✅ Referrals: $referralCount\n";
        
        // Count analytics
        $stmt = $connection->query("SELECT COUNT(*) as count FROM referral_analytics");
        $analyticsCount = $stmt->fetch()['count'];
        echo "  ✅ Analytics records: $analyticsCount\n";
        
        echo "\n🎉 Database initialization completed successfully!\n";
        echo "📁 Database file: " . realpath(__DIR__ . '/../database/eyedocs_demo.sqlite') . "\n";
        
    } else {
        echo "❌ Schema file not found: $schemaFile\n";
    }
    
} catch (Exception $e) {
    echo "❌ Database initialization failed: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n==========================================\n";
echo "Database initialization script completed.\n";
?>
