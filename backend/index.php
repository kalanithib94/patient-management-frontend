<?php
/**
 * File: index.php
 * Purpose: Main API router for Eye-Docs KTP Demo backend
 * Created: 2025-01-27 v1.0.0
 * Last Modified: 2025-01-27 v1.0.0
 * Author: AI Development Team
 * 
 * Dependencies: config.php, database_config.php
 * Database Tables: All tables for API operations
 * API Endpoints: Main entry point for all API requests
 * 
 * Changelog:
 * v1.0.0 - Initial creation with comprehensive API routing
 */

// Include configuration
require_once __DIR__ . '/config/config.php';

// Start output buffering to handle any unexpected output
ob_start();

// Set content type for API responses
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight OPTIONS requests for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get request information
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];
$query_string = $_SERVER['QUERY_STRING'] ?? '';

// Parse the request path
$path = parse_url($request_uri, PHP_URL_PATH);
$path = trim($path, '/');

// Remove any base path if running in subdirectory
if (strpos($path, 'backend/') === 0) {
    $path = substr($path, 8);
}

// Remove 'api' prefix if present
if (strpos($path, 'api/') === 0) {
    $path = substr($path, 4);
} elseif ($path === 'api') {
    $path = '';
}

// Get request body for POST/PUT requests
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Log the incoming request
logActivity("API Request: $request_method /$path", 'INFO');

try {
    // Route the request
    switch ($path) {
        // ==========================================
        // SYSTEM STATUS AND HEALTH CHECKS
        // ==========================================
        case '':
        case 'status':
            handleStatusRequest();
            break;
            
        case 'health':
            handleHealthCheck();
            break;
            
        case 'config':
            handleConfigRequest();
            break;
            
        // ==========================================
        // AUTHENTICATION ENDPOINTS
        // ==========================================
        case 'auth/login':
            if ($request_method === 'POST') {
                handleLogin($input);
            } else {
                respondWithError('Method not allowed', 405);
            }
            break;
            
        case 'auth/logout':
            if ($request_method === 'POST') {
                handleLogout();
            } else {
                respondWithError('Method not allowed', 405);
            }
            break;
            
        case 'auth/validate':
            if ($request_method === 'GET') {
                handleValidateToken();
            } else {
                respondWithError('Method not allowed', 405);
            }
            break;
            
        // ==========================================
        // OPTICIAN ENDPOINTS
        // ==========================================
        case 'opticians':
            if ($request_method === 'GET') {
                handleGetOpticians();
            } elseif ($request_method === 'POST') {
                handleCreateOptician($input);
            } else {
                respondWithError('Method not allowed', 405);
            }
            break;
            
        case (preg_match('/^opticians\/(\d+)$/', $path, $matches) ? true : false):
            $optician_id = $matches[1];
            if ($request_method === 'GET') {
                handleGetOptician($optician_id);
            } elseif ($request_method === 'PUT') {
                handleUpdateOptician($optician_id, $input);
            } elseif ($request_method === 'DELETE') {
                handleDeleteOptician($optician_id);
            } else {
                respondWithError('Method not allowed', 405);
            }
            break;
            
        // ==========================================
        // REFERRAL ENDPOINTS
        // ==========================================
        case 'referrals':
            if ($request_method === 'GET') {
                handleGetReferrals($_GET);
            } elseif ($request_method === 'POST') {
                handleCreateReferral($input);
            } else {
                respondWithError('Method not allowed', 405);
            }
            break;
            
        case (preg_match('/^referrals\/(\d+)$/', $path, $matches) ? true : false):
            $referral_id = $matches[1];
            if ($request_method === 'GET') {
                handleGetReferral($referral_id);
            } elseif ($request_method === 'PUT') {
                handleUpdateReferral($referral_id, $input);
            } elseif ($request_method === 'DELETE') {
                handleDeleteReferral($referral_id);
            } else {
                respondWithError('Method not allowed', 405);
            }
            break;
            
        case 'referrals/search':
            if ($request_method === 'GET') {
                handleSearchReferrals($_GET);
            } else {
                respondWithError('Method not allowed', 405);
            }
            break;
            
        case 'referrals/stats':
            if ($request_method === 'GET') {
                handleReferralStats($_GET);
            } else {
                respondWithError('Method not allowed', 405);
            }
            break;
            
        // ==========================================
        // ANALYTICS ENDPOINTS
        // ==========================================
        case 'analytics/dashboard':
            if ($request_method === 'GET') {
                handleAnalyticsDashboard($_GET);
            } else {
                respondWithError('Method not allowed', 405);
            }
            break;
            
        case 'analytics/forecast':
            if ($request_method === 'GET') {
                handleForecast($_GET);
            } elseif ($request_method === 'POST') {
                handleGenerateForecast($input);
            } else {
                respondWithError('Method not allowed', 405);
            }
            break;
            
        case 'analytics/trends':
            if ($request_method === 'GET') {
                handleTrends($_GET);
            } else {
                respondWithError('Method not allowed', 405);
            }
            break;
            
        // ==========================================
        // SALESFORCE INTEGRATION ENDPOINTS
        // ==========================================
        case 'salesforce/sync':
            if ($request_method === 'POST') {
                handleSalesforceSync($input);
            } else {
                respondWithError('Method not allowed', 405);
            }
            break;
            
        case 'salesforce/status':
            if ($request_method === 'GET') {
                handleSalesforceStatus();
            } else {
                respondWithError('Method not allowed', 405);
            }
            break;
            
        case 'salesforce/test':
            if ($request_method === 'GET') {
                handleSalesforceTest();
            } else {
                respondWithError('Method not allowed', 405);
            }
            break;
            
        // ==========================================
        // DEFAULT - ENDPOINT NOT FOUND
        // ==========================================
        default:
            handleNotFound($path);
            break;
    }
    
} catch (Exception $e) {
    logActivity("API Error: " . $e->getMessage(), 'ERROR');
    respondWithError('Internal server error: ' . $e->getMessage(), 500);
}

// Clean output buffer and exit
ob_end_clean();

// ==========================================
// HANDLER FUNCTIONS
// ==========================================

/**
 * Handle status request
 */
function handleStatusRequest() {
    $status = [
        'service' => 'EyeDocs KTP API',
        'version' => APP_VERSION,
        'status' => 'online',
        'timestamp' => date('c'),
        'environment' => DEBUG ? 'development' : 'production',
        'features' => [
            'database' => true,
            'salesforce' => SALESFORCE_ENABLED,
            'analytics' => ENABLE_ANALYTICS,
            'forecasting' => ENABLE_FORECASTING
        ]
    ];
    
    respondWithSuccess($status);
}

/**
 * Handle health check
 */
function handleHealthCheck() {
    $health = [
        'status' => 'healthy',
        'checks' => []
    ];
    
    // Database health check
    try {
        $db = DatabaseConfig::getInstance();
        $result = $db->testConnection();
        $health['checks']['database'] = [
            'status' => $result['status'] === 'success' ? 'healthy' : 'unhealthy',
            'response_time_ms' => 0 // Could add timing
        ];
    } catch (Exception $e) {
        $health['checks']['database'] = [
            'status' => 'unhealthy',
            'error' => $e->getMessage()
        ];
        $health['status'] = 'degraded';
    }
    
    // Salesforce health check (if enabled)
    if (SALESFORCE_ENABLED) {
        $health['checks']['salesforce'] = [
            'status' => 'not_implemented',
            'message' => 'Salesforce health check not yet implemented'
        ];
    }
    
    $httpCode = $health['status'] === 'healthy' ? 200 : 503;
    respondWithSuccess($health, 'Health check completed', $httpCode);
}

/**
 * Handle configuration request
 */
function handleConfigRequest() {
    $config = [
        'app_name' => APP_NAME,
        'version' => APP_VERSION,
        'environment' => DEBUG ? 'development' : 'production',
        'features' => [
            'salesforce_enabled' => SALESFORCE_ENABLED,
            'analytics_enabled' => ENABLE_ANALYTICS,
            'forecasting_enabled' => ENABLE_FORECASTING,
            'demo_mode' => DEMO_MODE
        ],
        'api' => [
            'base_url' => API_BASE_URL,
            'version' => 'v1'
        ],
        'frontend_url' => FRONTEND_URL
    ];
    
    respondWithSuccess($config);
}

/**
 * Handle login request
 */
function handleLogin($input) {
    $required = ['email', 'password'];
    $missing = validateRequired($input, $required);
    
    if (!empty($missing)) {
        respondWithError('Missing required fields: ' . implode(', ', $missing), 400);
        return;
    }
    
    // For demo purposes, we'll implement a simple authentication
    // In production, this would hash passwords and check against database
    if ($input['email'] === 'demo@eyedocs.com' && $input['password'] === 'demo123') {
        $token = base64_encode(json_encode([
            'user_id' => 1,
            'email' => $input['email'],
            'expires' => time() + SESSION_TIMEOUT
        ]));
        
        respondWithSuccess([
            'token' => $token,
            'user' => [
                'id' => 1,
                'email' => $input['email'],
                'name' => 'Demo User'
            ],
            'expires_at' => date('c', time() + SESSION_TIMEOUT)
        ], 'Login successful');
    } else {
        respondWithError('Invalid credentials', 401);
    }
}

/**
 * Handle logout request
 */
function handleLogout() {
    // In a real implementation, we'd invalidate the token
    respondWithSuccess(null, 'Logout successful');
}

/**
 * Handle token validation
 */
function handleValidateToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        // Simple token validation for demo
        $decoded = json_decode(base64_decode($token), true);
        
        if ($decoded && isset($decoded['expires']) && $decoded['expires'] > time()) {
            respondWithSuccess([
                'valid' => true,
                'user' => [
                    'id' => $decoded['user_id'],
                    'email' => $decoded['email']
                ]
            ]);
        } else {
            respondWithError('Token expired or invalid', 401);
        }
    } else {
        respondWithError('No authorization token provided', 401);
    }
}

/**
 * Handle get opticians request
 */
function handleGetOpticians() {
    try {
        $db = getDatabase();
        $stmt = $db->prepare('
            SELECT id, practice_name, contact_person, email, phone, 
                   city, postcode, status, created_at 
            FROM opticians 
            WHERE status != "deleted"
            ORDER BY practice_name
        ');
        $stmt->execute();
        $opticians = $stmt->fetchAll();
        
        respondWithSuccess($opticians);
    } catch (Exception $e) {
        respondWithError('Failed to fetch opticians: ' . $e->getMessage(), 500);
    }
}

/**
 * Handle create referral request (placeholder)
 */
function handleCreateReferral($input) {
    $required = ['patient_name', 'condition', 'optician_id'];
    $missing = validateRequired($input, $required);
    
    if (!empty($missing)) {
        respondWithError('Missing required fields: ' . implode(', ', $missing), 400);
        return;
    }
    
    try {
        $db = getDatabase();
        
        // Generate referral number
        $referralNumber = 'REF-' . date('Ym') . '-' . sprintf('%04d', rand(1, 9999));
        
        $stmt = $db->prepare('
            INSERT INTO referrals (
                referral_number, optician_id, patient_name, condition, 
                urgency, clinical_notes, status, date_received
            ) VALUES (?, ?, ?, ?, ?, ?, "received", NOW())
        ');
        
        $stmt->execute([
            $referralNumber,
            $input['optician_id'],
            $input['patient_name'],
            $input['condition'],
            $input['urgency'] ?? 'routine',
            $input['clinical_notes'] ?? ''
        ]);
        
        $referralId = $db->lastInsertId();
        
        // Fetch the created referral
        $stmt = $db->prepare('SELECT * FROM referrals WHERE id = ?');
        $stmt->execute([$referralId]);
        $referral = $stmt->fetch();
        
        logActivity("Referral created: $referralNumber", 'INFO');
        respondWithSuccess($referral, 'Referral created successfully', 201);
        
    } catch (Exception $e) {
        respondWithError('Failed to create referral: ' . $e->getMessage(), 500);
    }
}

/**
 * Handle get referrals request
 */
function handleGetReferrals($params) {
    try {
        $db = getDatabase();
        
        $where = ['1=1'];
        $bindings = [];
        
        // Add filters
        if (isset($params['status'])) {
            $where[] = 'r.status = ?';
            $bindings[] = $params['status'];
        }
        
        if (isset($params['optician_id'])) {
            $where[] = 'r.optician_id = ?';
            $bindings[] = $params['optician_id'];
        }
        
        if (isset($params['condition'])) {
            $where[] = 'r.condition = ?';
            $bindings[] = $params['condition'];
        }
        
        // Pagination
        $page = (int)($params['page'] ?? 1);
        $limit = (int)($params['limit'] ?? 20);
        $offset = ($page - 1) * $limit;
        
        $sql = '
            SELECT r.*, o.practice_name, o.contact_person
            FROM referrals r
            LEFT JOIN opticians o ON r.optician_id = o.id
            WHERE ' . implode(' AND ', $where) . '
            ORDER BY r.date_received DESC
            LIMIT ? OFFSET ?
        ';
        
        $bindings[] = $limit;
        $bindings[] = $offset;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($bindings);
        $referrals = $stmt->fetchAll();
        
        // Get total count
        $countSql = '
            SELECT COUNT(*) 
            FROM referrals r 
            WHERE ' . implode(' AND ', array_slice($where, 0, -2));
        $countStmt = $db->prepare($countSql);
        $countStmt->execute(array_slice($bindings, 0, -2));
        $total = $countStmt->fetchColumn();
        
        respondWithSuccess([
            'referrals' => $referrals,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'pages' => ceil($total / $limit)
            ]
        ]);
        
    } catch (Exception $e) {
        respondWithError('Failed to fetch referrals: ' . $e->getMessage(), 500);
    }
}

/**
 * Handle referral search request
 */
function handleSearchReferrals($params) {
    try {
        $db = getDatabase();
        
        $where = ['1=1'];
        $bindings = [];
        
        // Search by patient name
        if (!empty($params['search'])) {
            $searchTerm = '%' . $params['search'] . '%';
            $where[] = '(r.patient_name LIKE ? OR r.referral_number LIKE ?)';
            $bindings[] = $searchTerm;
            $bindings[] = $searchTerm;
        }
        
        // Filter by status
        if (!empty($params['status'])) {
            $where[] = 'r.status = ?';
            $bindings[] = $params['status'];
        }
        
        // Filter by condition
        if (!empty($params['condition'])) {
            $where[] = 'r.condition = ?';
            $bindings[] = $params['condition'];
        }
        
        // Filter by urgency
        if (!empty($params['urgency'])) {
            $where[] = 'r.urgency = ?';
            $bindings[] = $params['urgency'];
        }
        
        // Filter by optician
        if (!empty($params['optician_id'])) {
            $where[] = 'r.optician_id = ?';
            $bindings[] = $params['optician_id'];
        }
        
        // Filter by date range
        if (!empty($params['date_from'])) {
            $where[] = 'r.date_received >= ?';
            $bindings[] = $params['date_from'];
        }
        
        if (!empty($params['date_to'])) {
            $where[] = 'r.date_received <= ?';
            $bindings[] = $params['date_to'];
        }
        
        // Pagination
        $page = (int)($params['page'] ?? 1);
        $limit = (int)($params['limit'] ?? 20);
        $offset = ($page - 1) * $limit;
        
        $sql = '
            SELECT r.*, o.practice_name, o.contact_person
            FROM referrals r
            LEFT JOIN opticians o ON r.optician_id = o.id
            WHERE ' . implode(' AND ', $where) . '
            ORDER BY r.date_received DESC
            LIMIT ? OFFSET ?
        ';
        
        $bindings[] = $limit;
        $bindings[] = $offset;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($bindings);
        $referrals = $stmt->fetchAll();
        
        // Get total count for pagination
        $countSql = 'SELECT COUNT(*) as total FROM referrals r WHERE ' . implode(' AND ', $where);
        $countStmt = $db->prepare($countSql);
        $countStmt->execute(array_slice($bindings, 0, -2));
        $countResult = $countStmt->fetch();
        $total = $countResult['total'];
        
        // Get search summary
        $summary = [
            'total_results' => $total,
            'current_page' => $page,
            'total_pages' => ceil($total / $limit),
            'results_per_page' => $limit,
            'filters_applied' => array_filter([
                'search' => $params['search'] ?? null,
                'status' => $params['status'] ?? null,
                'condition' => $params['condition'] ?? null,
                'urgency' => $params['urgency'] ?? null,
                'optician_id' => $params['optician_id'] ?? null,
                'date_from' => $params['date_from'] ?? null,
                'date_to' => $params['date_to'] ?? null
            ])
        ];
        
        respondWithSuccess([
            'referrals' => $referrals,
            'summary' => $summary,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'pages' => ceil($total / $limit)
            ]
        ]);
        
    } catch (Exception $e) {
        respondWithError('Failed to search referrals: ' . $e->getMessage(), 500);
    }
}

/**
 * Handle referral stats request
 */
function handleReferralStats($params) {
    try {
        $db = getDatabase();
        
        $where = ['1=1'];
        $bindings = [];
        
        // Filter by date range
        if (!empty($params['date_from'])) {
            $where[] = 'r.date_received >= ?';
            $bindings[] = $params['date_from'];
        }
        
        if (!empty($params['date_to'])) {
            $where[] = 'r.date_received <= ?';
            $bindings[] = $params['date_to'];
        }
        
        // Filter by optician
        if (!empty($params['optician_id'])) {
            $where[] = 'r.optician_id = ?';
            $bindings[] = $params['optician_id'];
        }
        
        // Filter by status
        if (!empty($params['status'])) {
            $where[] = 'r.status = ?';
            $bindings[] = $params['status'];
        }
        
        // Filter by urgency
        if (!empty($params['urgency'])) {
            $where[] = 'r.urgency = ?';
            $bindings[] = $params['urgency'];
        }
        
        // Filter by condition
        if (!empty($params['condition'])) {
            $where[] = 'r.condition = ?';
            $bindings[] = $params['condition'];
        }
        
        $sql = '
            SELECT 
                COUNT(DISTINCT r.id) as total_referrals,
                COUNT(DISTINCT CASE WHEN r.status = "received" THEN r.id END) as received_count,
                COUNT(DISTINCT CASE WHEN r.status = "scheduled" THEN r.id END) as scheduled_count,
                COUNT(DISTINCT CASE WHEN r.status = "completed" THEN r.id END) as completed_count,
                COUNT(DISTINCT CASE WHEN r.status = "cancelled" THEN r.id END) as cancelled_count,
                COUNT(DISTINCT CASE WHEN r.urgency = "urgent" THEN r.id END) as urgent_count,
                COUNT(DISTINCT CASE WHEN r.urgency = "routine" THEN r.id END) as routine_count,
                COUNT(DISTINCT CASE WHEN r.urgency = "emergency" THEN r.id END) as emergency_count,
                COUNT(DISTINCT CASE WHEN r.condition = "Cataract" THEN r.id END) as cataract_count,
                COUNT(DISTINCT CASE WHEN r.condition = "AMD" THEN r.id END) as amd_count,
                COUNT(DISTINCT CASE WHEN r.condition = "Oculoplastics" THEN r.id END) as oculoplastics_count,
                COUNT(DISTINCT CASE WHEN r.condition = "Vitreoretinal" THEN r.id END) as vitreoretinal_count,
                COUNT(DISTINCT r.optician_id) as unique_opticians
            FROM referrals r
            WHERE ' . implode(' AND ', $where) . '
        ';
        
        $stmt = $db->prepare($sql);
        $stmt->execute($bindings);
        $stats = $stmt->fetch();
        
        // Calculate percentages
        $total = $stats['total_referrals'];
        if ($total > 0) {
            $stats['completion_rate'] = round(($stats['completed_count'] / $total) * 100, 2);
            $stats['urgent_percentage'] = round(($stats['urgent_count'] / $total) * 100, 2);
            $stats['cataract_percentage'] = round(($stats['cataract_count'] / $total) * 100, 2);
            $stats['amd_percentage'] = round(($stats['amd_count'] / $total) * 100, 2);
        } else {
            $stats['completion_rate'] = 0;
            $stats['urgent_percentage'] = 0;
            $stats['cataract_percentage'] = 0;
            $stats['amd_percentage'] = 0;
        }
        
        // Add metadata
        $stats['period'] = [
            'date_from' => $params['date_from'] ?? 'all_time',
            'date_to' => $params['date_to'] ?? 'all_time',
            'generated_at' => date('c')
        ];
        
        respondWithSuccess($stats);
        
    } catch (Exception $e) {
        respondWithError('Failed to fetch referral stats: ' . $e->getMessage(), 500);
    }
}

function handleSalesforceTest() {
    if (!SALESFORCE_ENABLED) {
        respondWithError('Salesforce integration is disabled', 503);
        return;
    }
    
    try {
        require_once __DIR__ . '/integrations/salesforce_connector.php';
        
        $sf = new SalesforceConnector();
        $status = $sf->getConnectionStatus();
        
        if ($status['configured']) {
            // Try to test connection
            $testResult = $sf->testConnection();
            $status['connection_test'] = $testResult;
            
            if ($testResult['status'] === 'success') {
                $status['message'] = 'Salesforce integration working successfully';
            } else {
                $status['message'] = 'Salesforce configured but connection failed: ' . $testResult['message'];
            }
        } else {
            $status['message'] = 'Salesforce integration framework ready. Credentials not configured.';
        }
        
        respondWithSuccess($status);
        
    } catch (Exception $e) {
        respondWithError('Salesforce test failed: ' . $e->getMessage(), 500);
    }
}

/**
 * Handle not found request
 */
function handleNotFound($path) {
    $availableEndpoints = [
        'GET /api/status - API status check',
        'GET /api/health - Health check',
        'GET /api/config - Configuration info',
        'POST /api/auth/login - User authentication',
        'GET /api/opticians - List opticians',
        'POST /api/referrals - Create referral',
        'GET /api/referrals - List referrals',
        'GET /api/analytics/dashboard - Analytics dashboard',
        'GET /api/salesforce/test - Test Salesforce connection'
    ];
    
    respondWithError("Endpoint not found: /$path", 404, [
        'available_endpoints' => $availableEndpoints
    ]);
}

// ==========================================
// RESPONSE HELPER FUNCTIONS
// ==========================================

/**
 * Send success response
 */
function respondWithSuccess($data = null, $message = null, $code = 200) {
    echo generateApiResponse('success', $data, $message, $code);
    exit;
}

/**
 * Send error response
 */
function respondWithError($message, $code = 400, $extra = null) {
    $response = [
        'status' => 'error',
        'message' => $message,
        'timestamp' => date('c'),
        'version' => APP_VERSION
    ];
    
    if ($extra !== null) {
        $response = array_merge($response, $extra);
    }
    
    http_response_code($code);
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit;
}

// Placeholder handlers for other endpoints
function handleCreateOptician($input) { respondWithError('Not implemented yet', 501); }
function handleGetOptician($id) { respondWithError('Not implemented yet', 501); }
function handleUpdateOptician($id, $input) { respondWithError('Not implemented yet', 501); }
function handleDeleteOptician($id) { respondWithError('Not implemented yet', 501); }
function handleGetReferral($id) { respondWithError('Not implemented yet', 501); }
function handleUpdateReferral($id, $input) { respondWithError('Not implemented yet', 501); }
function handleDeleteReferral($id) { respondWithError('Not implemented yet', 501); }


function handleAnalyticsDashboard($params) { 
    try {
        $db = getDatabase();
        
        // Get current month analytics
        $currentMonth = date('Y-m');
        $stmt = $db->prepare('
            SELECT * FROM referral_analytics 
            WHERE period_type = "monthly" 
            AND period_start LIKE ? 
            ORDER BY period_start DESC 
            LIMIT 3
        ');
        $stmt->execute([$currentMonth . '%']);
        $monthlyData = $stmt->fetchAll();
        
        // Get current referrals count
        $stmt = $db->prepare('SELECT COUNT(*) as total FROM referrals');
        $stmt->execute();
        $totalReferrals = $stmt->fetch()['total'];
        
        // Get referrals by status
        $stmt = $db->prepare('
            SELECT status, COUNT(*) as count 
            FROM referrals 
            GROUP BY status
        ');
        $stmt->execute();
        $statusBreakdown = $stmt->fetchAll();
        
        // Get referrals by condition
        $stmt = $db->prepare('
            SELECT condition, COUNT(*) as count 
            FROM referrals 
            GROUP BY condition
        ');
        $stmt->execute();
        $conditionBreakdown = $stmt->fetchAll();
        
        // Get referrals by urgency
        $stmt = $db->prepare('
            SELECT urgency, COUNT(*) as count 
            FROM referrals 
            GROUP BY urgency
        ');
        $stmt->execute();
        $urgencyBreakdown = $stmt->fetchAll();
        
        // Get recent referrals (last 7 days)
        $stmt = $db->prepare('
            SELECT r.*, o.practice_name 
            FROM referrals r 
            LEFT JOIN opticians o ON r.optician_id = o.id 
            WHERE r.date_received >= date("now", "-7 days")
            ORDER BY r.date_received DESC
        ');
        $stmt->execute();
        $recentReferrals = $stmt->fetchAll();
        
        // Calculate trends
        $trends = [];
        if (count($monthlyData) >= 2) {
            $current = $monthlyData[0];
            $previous = $monthlyData[1];
            
            $trends = [
                'total_referrals' => [
                    'current' => $current['total_referrals'],
                    'previous' => $previous['total_referrals'],
                    'change' => $current['total_referrals'] - $previous['total_referrals'],
                    'percentage' => $previous['total_referrals'] > 0 ? 
                        round((($current['total_referrals'] - $previous['total_referrals']) / $previous['total_referrals']) * 100, 1) : 0
                ],
                'cataract_referrals' => [
                    'current' => $current['cataract_referrals'],
                    'previous' => $previous['cataract_referrals'],
                    'change' => $current['cataract_referrals'] - $previous['cataract_referrals']
                ],
                'amd_referrals' => [
                    'current' => $current['amd_referrals'],
                    'previous' => $previous['amd_referrals'],
                    'change' => $current['amd_referrals'] - $previous['amd_referrals']
                ]
            ];
        }
        
        $dashboard = [
            'summary' => [
                'total_referrals' => $totalReferrals,
                'current_month' => $currentMonth,
                'last_updated' => date('c')
            ],
            'monthly_trends' => $monthlyData,
            'status_breakdown' => $statusBreakdown,
            'condition_breakdown' => $conditionBreakdown,
            'urgency_breakdown' => $urgencyBreakdown,
            'recent_referrals' => $recentReferrals,
            'trends' => $trends,
            'forecasts' => array_map(function($month) {
                return [
                    'period' => $month['period_start'],
                    'forecast' => $month['forecast_next_period'],
                    'confidence' => $month['forecast_confidence']
                ];
            }, array_filter($monthlyData, function($month) {
                return !is_null($month['forecast_next_period']);
            }))
        ];
        
        respondWithSuccess($dashboard);
        
    } catch (Exception $e) {
        respondWithError('Failed to fetch analytics dashboard: ' . $e->getMessage(), 500);
    }
}
function handleForecast($params) { respondWithError('Not implemented yet', 501); }
function handleGenerateForecast($input) { respondWithError('Not implemented yet', 501); }
function handleTrends($params) { respondWithError('Not implemented yet', 501); }
function handleSalesforceSync($input) { respondWithError('Not implemented yet', 501); }
function handleSalesforceStatus() { 
    try {
        require_once __DIR__ . '/integrations/salesforce_connector.php';
        $sf = new SalesforceConnector();
        
        $connectionStatus = $sf->getConnectionStatus();
        $status = [
            'enabled' => SALESFORCE_ENABLED,
            'connected' => $connectionStatus['connected'],
            'instance_url' => SALESFORCE_INSTANCE_URL,
            'api_version' => $connectionStatus['api_version'],
            'username' => SALESFORCE_USERNAME,
            'access_token_available' => !empty(SALESFORCE_ACCESS_TOKEN),
            'configured' => $connectionStatus['configured'],
            'last_test' => date('Y-m-d H:i:s')
        ];
        
        respondWithSuccess($status, 'Salesforce status retrieved successfully');
    } catch (Exception $e) {
        respondWithError('Salesforce status failed: ' . $e->getMessage(), 500);
    }
}
?>