<?php
/**
 * File: salesforce_connector.php
 * Purpose: Salesforce integration connector for Eye-Docs KTP Demo
 * Created: 2025-01-27 v1.0.0
 * Author: AI Development Team
 */

class SalesforceConnector {
    private $accessToken;
    private $instanceUrl;
    private $apiVersion;
    private $isConnected = false;
    private $clientId;
    private $clientSecret;
    private $username;
    private $password;
    private $securityToken;
    
    public function __construct() {
        $this->apiVersion = 'v58.0';
        $this->loadConfiguration();
    }
    
    /**
     * Load Salesforce configuration from environment and constants
     */
    private function loadConfiguration() {
        // Try constants first, then environment variables as fallback
        $this->instanceUrl = defined('SALESFORCE_INSTANCE_URL') ? SALESFORCE_INSTANCE_URL : ($_ENV['SALESFORCE_INSTANCE_URL'] ?? '');
        $this->clientId = defined('SALESFORCE_CLIENT_ID') ? SALESFORCE_CLIENT_ID : ($_ENV['SALESFORCE_CLIENT_ID'] ?? '');
        $this->clientSecret = defined('SALESFORCE_CLIENT_SECRET') ? SALESFORCE_CLIENT_SECRET : ($_ENV['SALESFORCE_CLIENT_SECRET'] ?? '');
        $this->username = defined('SALESFORCE_USERNAME') ? SALESFORCE_USERNAME : ($_ENV['SALESFORCE_USERNAME'] ?? '');
        $this->password = defined('SALESFORCE_PASSWORD') ? SALESFORCE_PASSWORD : ($_ENV['SALESFORCE_PASSWORD'] ?? '');
        $this->securityToken = defined('SALESFORCE_SECURITY_TOKEN') ? SALESFORCE_SECURITY_TOKEN : ($_ENV['SALESFORCE_SECURITY_TOKEN'] ?? '');
        
        // Check for access token (preferred method)
        $this->accessToken = defined('SALESFORCE_ACCESS_TOKEN') ? SALESFORCE_ACCESS_TOKEN : ($_ENV['SALESFORCE_ACCESS_TOKEN'] ?? '');
        
        // If we have an access token, we're already connected
        if (!empty($this->accessToken)) {
            $this->isConnected = true;
        }
    }
    
    /**
     * Authenticate with Salesforce using username/password flow
     */
    public function authenticate() {
        try {
            if (empty($this->clientId) || empty($this->clientSecret) || 
                empty($this->username) || empty($this->password)) {
                throw new Exception('Salesforce credentials not configured');
            }
            
            // Check if cURL is available
            if (!function_exists('curl_init')) {
                throw new Exception('cURL extension not available in PHP');
            }
            
            $authUrl = 'https://login.salesforce.com/services/oauth2/token';
            
            $postData = [
                'grant_type' => 'password',
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'username' => $this->username,
                'password' => $this->password . $this->securityToken
            ];
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $authUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode !== 200) {
                throw new Exception("Authentication failed with HTTP code: $httpCode");
            }
            
            $authData = json_decode($response, true);
            
            if (isset($authData['access_token'])) {
                $this->accessToken = $authData['access_token'];
                $this->instanceUrl = $authData['instance_url'];
                $this->isConnected = true;
                
                $this->logActivity('salesforce_auth', 'Authentication successful');
                return true;
            } else {
                throw new Exception('No access token received from Salesforce');
            }
            
        } catch (Exception $e) {
            $this->logError('Salesforce authentication failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Test Salesforce connection
     */
    public function testConnection() {
        try {
            // Check if cURL is available
            if (!function_exists('curl_init')) {
                return [
                    'status' => 'error',
                    'message' => 'cURL extension not available in PHP. Required for Salesforce integration.'
                ];
            }
            
            // If we have an access token, use it directly
            if (!empty($this->accessToken)) {
                // Test with a simple query using access token
                $query = 'SELECT Id, Name FROM User LIMIT 1';
                $result = $this->executeQuery($query);
                
                if ($result && isset($result['records'])) {
                    return [
                        'status' => 'success',
                        'message' => 'Salesforce connection successful',
                        'instance_url' => $this->instanceUrl,
                        'api_version' => $this->apiVersion,
                        'user_count' => count($result['records'])
                    ];
                } else {
                    return [
                        'status' => 'error',
                        'message' => 'Query execution failed'
                    ];
                }
            } else {
                // Fallback to username/password authentication
                if (!$this->isConnected) {
                    if (!$this->authenticate()) {
                        return [
                            'status' => 'error',
                            'message' => 'Authentication failed'
                        ];
                    }
                }
                
                // Test with a simple query
                $query = 'SELECT Id, Name FROM User LIMIT 1';
                $result = $this->executeQuery($query);
                
                if ($result && isset($result['records'])) {
                    return [
                        'status' => 'success',
                        'message' => 'Salesforce connection successful',
                        'instance_url' => $this->instanceUrl,
                        'api_version' => $this->apiVersion,
                        'user_count' => count($result['records'])
                    ];
                } else {
                    return [
                        'status' => 'error',
                        'message' => 'Query execution failed'
                    ];
                }
            }
            
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Execute SOQL query
     */
    public function executeQuery($query) {
        try {
            if (!$this->isConnected) {
                throw new Exception('Not connected to Salesforce');
            }
            
            $url = $this->instanceUrl . '/services/data/' . $this->apiVersion . '/query';
            $url .= '?q=' . urlencode($query);
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $this->accessToken,
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode !== 200) {
                throw new Exception("Query failed with HTTP code: $httpCode");
            }
            
            return json_decode($response, true);
            
        } catch (Exception $e) {
            $this->logError('Salesforce query failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Create record in Salesforce
     */
    public function createRecord($objectType, $data) {
        try {
            if (!$this->isConnected) {
                throw new Exception('Not connected to Salesforce');
            }
            
            $url = $this->instanceUrl . '/services/data/' . $this->apiVersion . '/sobjects/' . $objectType;
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $this->accessToken,
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode !== 201) {
                throw new Exception("Record creation failed with HTTP code: $httpCode");
            }
            
            $result = json_decode($response, true);
            $this->logActivity('salesforce_create', "Record created in $objectType: " . ($result['id'] ?? 'unknown'));
            
            return $result;
            
        } catch (Exception $e) {
            $this->logError('Salesforce record creation failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update record in Salesforce
     */
    public function updateRecord($objectType, $recordId, $data) {
        try {
            if (!$this->isConnected) {
                throw new Exception('Not connected to Salesforce');
            }
            
            $url = $this->instanceUrl . '/services/data/' . $this->apiVersion . '/sobjects/' . $objectType . '/' . $recordId;
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $this->accessToken,
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode !== 204) {
                throw new Exception("Record update failed with HTTP code: $httpCode");
            }
            
            $this->logActivity('salesforce_update', "Record updated in $objectType: $recordId");
            return true;
            
        } catch (Exception $e) {
            $this->logError('Salesforce record update failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Sync referral data to Salesforce
     */
    public function syncReferral($referralData) {
        try {
            if (!$this->isConnected) {
                throw new Exception('Not connected to Salesforce');
            }
            
            // Map referral data to Salesforce fields
            $sfData = [
                'Referral_Number__c' => $referralData['referral_number'],
                'Patient_Name__c' => $referralData['patient_name'],
                'Condition__c' => $referralData['condition'],
                'Urgency__c' => $referralData['urgency'],
                'Status__c' => $referralData['status'],
                'Clinical_Notes__c' => $referralData['clinical_notes'] ?? '',
                'Date_Received__c' => $referralData['date_received'],
                'Optician_Practice__c' => $referralData['practice_name'] ?? ''
            ];
            
            // Check if referral already exists
            $query = "SELECT Id FROM Referral__c WHERE Referral_Number__c = '" . addslashes($referralData['referral_number']) . "'";
            $existing = $this->executeQuery($query);
            
            if ($existing && isset($existing['records']) && count($existing['records']) > 0) {
                // Update existing record
                $recordId = $existing['records'][0]['Id'];
                $result = $this->updateRecord('Referral__c', $recordId, $sfData);
                $action = 'updated';
            } else {
                // Create new record
                $result = $this->createRecord('Referral__c', $sfData);
                $action = 'created';
            }
            
            if ($result) {
                $this->logActivity('salesforce_sync', "Referral {$action} in Salesforce: " . $referralData['referral_number']);
                return [
                    'status' => 'success',
                    'action' => $action,
                    'referral_number' => $referralData['referral_number']
                ];
            } else {
                throw new Exception("Failed to {$action} referral in Salesforce");
            }
            
        } catch (Exception $e) {
            $this->logError('Salesforce referral sync failed: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Get Salesforce object metadata
     */
    public function getObjectMetadata($objectType) {
        try {
            if (!$this->isConnected) {
                throw new Exception('Not connected to Salesforce');
            }
            
            $url = $this->instanceUrl . '/services/data/' . $this->apiVersion . '/sobjects/' . $objectType . '/describe';
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $this->accessToken,
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode !== 200) {
                throw new Exception("Metadata retrieval failed with HTTP code: $httpCode");
            }
            
            return json_decode($response, true);
            
        } catch (Exception $e) {
            $this->logError('Salesforce metadata retrieval failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Log Salesforce activity
     */
    private function logActivity($action, $description) {
        $logFile = __DIR__ . '/../../logs/salesforce.log';
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
     * Log Salesforce errors
     */
    private function logError($message) {
        $this->logActivity('ERROR', $message);
        error_log("[Salesforce] " . $message);
    }
    
    /**
     * Get connection status
     */
    public function getConnectionStatus() {
        return [
            'connected' => $this->isConnected,
            'instance_url' => $this->instanceUrl,
            'api_version' => $this->apiVersion,
            'configured' => !empty($this->clientId) && !empty($this->clientSecret)
        ];
    }
    
    /**
     * Disconnect from Salesforce
     */
    public function disconnect() {
        $this->accessToken = null;
        $this->isConnected = false;
        $this->logActivity('salesforce_disconnect', 'Disconnected from Salesforce');
    }
}
?>
