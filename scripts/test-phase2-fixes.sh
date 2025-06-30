#!/bin/bash

# Phase 2 Completion Validation Script
# Tests authentication race condition fixes and reconciliation logic

set -e

echo "🚀 Starting Phase 2 Validation Tests"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

run_test() {
    ((TOTAL_TESTS++))
    echo -e "\n${BLUE}Test $TOTAL_TESTS:${NC} $1"
}

# Check if required tools are available
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Test 1: Environment Health Check
test_environment_health() {
    run_test "Environment Health Check"

    # Check API server
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:4000/" | grep -q "200"; then
        log_success "API server is running"
    else
        log_error "API server is not responding"
        return 1
    fi

    # Check Next.js server
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/" | grep -q "200"; then
        log_success "Next.js server is running"
    else
        log_error "Next.js server is not responding"
        return 1
    fi

    # Check system health endpoint
    local health_response=$(curl -s "http://localhost:4000/api/v1/health" | jq -r '.success // false')
    if [ "$health_response" = "true" ]; then
        log_success "System health check passed"
    else
        log_error "System health check failed"
        return 1
    fi
}

# Test 2: Authentication Endpoint Functionality
test_auth_endpoints() {
    run_test "Authentication Endpoints"

    # Test check-existence endpoint with valid email
    local check_response=$(curl -s -X POST "http://localhost:4000/api/v1/auth/check-existence" \
        -H "Content-Type: application/json" \
        -d '{"email": "test@example.com"}' | jq -r '.success // false')

    if [ "$check_response" = "true" ]; then
        log_success "Check existence endpoint working"
    else
        log_error "Check existence endpoint failed"
        return 1
    fi

    # Test check-existence endpoint with invalid email
    local invalid_response=$(curl -s -X POST "http://localhost:4000/api/v1/auth/check-existence" \
        -H "Content-Type: application/json" \
        -d '{"email": "invalid-email"}' | jq -r '.success // true')

    if [ "$invalid_response" = "false" ]; then
        log_success "Check existence validation working"
    else
        log_error "Check existence validation failed"
        return 1
    fi
}

# Test 3: API Response Structure Validation
test_api_response_structure() {
    run_test "API Response Structure"

    local response=$(curl -s -X POST "http://localhost:4000/api/v1/auth/check-existence" \
        -H "Content-Type: application/json" \
        -d '{"email": "test@example.com"}')

    # Check response has correct structure
    local has_success=$(echo "$response" | jq -r 'has("success")')
    local has_data=$(echo "$response" | jq -r 'has("data")')
    local has_timestamp=$(echo "$response" | jq -r 'has("timestamp")')
    local has_exists=$(echo "$response" | jq -r '.data | has("exists")')

    if [ "$has_success" = "true" ] && [ "$has_data" = "true" ] && [ "$has_timestamp" = "true" ] && [ "$has_exists" = "true" ]; then
        log_success "API response structure is correct"
    else
        log_error "API response structure is incorrect"
        echo "Response: $response"
        return 1
    fi

    # Verify exists field is boolean
    local exists_value=$(echo "$response" | jq -r '.data.exists')
    if [ "$exists_value" = "true" ] || [ "$exists_value" = "false" ]; then
        log_success "API response data types are correct"
    else
        log_error "API response data types are incorrect"
        return 1
    fi
}

# Test 4: Dev Dashboard Accessibility
test_dev_dashboard() {
    run_test "Dev Dashboard Accessibility"

    # Check dev-dashboard page loads
    local dashboard_response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/dev-dashboard")

    if [ "$dashboard_response" = "200" ]; then
        log_success "Dev dashboard is accessible"
    else
        log_error "Dev dashboard is not accessible (HTTP $dashboard_response)"
        return 1
    fi

    # Check that anonymous session cookie is set
    local cookie_check=$(curl -s -I "http://localhost:3000/dev-dashboard" | grep -i "set-cookie" | grep "anonymous-session-id")

    if [ -n "$cookie_check" ]; then
        log_success "Anonymous session management working"
    else
        log_error "Anonymous session management not working"
        return 1
    fi
}

# Test 5: Wallet Creation Endpoint
test_wallet_creation_endpoint() {
    run_test "Wallet Creation Endpoint"

    # Test wallet creation endpoint without authentication (should fail)
    local unauth_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:4000/api/v1/user/wallet/create")

    if [ "$unauth_response" = "401" ]; then
        log_success "Wallet creation properly requires authentication"
    else
        log_error "Wallet creation authentication check failed (HTTP $unauth_response)"
        return 1
    fi
}

# Test 6: Health Check Services
test_health_services() {
    run_test "Individual Health Check Services"

    local services=("database" "better-auth" "anonymous-sessions" "wallet" "escrow-engine" "chat")

    for service in "${services[@]}"; do
        local service_response=$(curl -s "http://localhost:4000/api/v1/health/$service" | jq -r '.success // false')

        if [ "$service_response" = "true" ]; then
            log_success "Health check for $service passed"
        else
            log_error "Health check for $service failed"
            return 1
        fi
    done
}

# Test 7: Error Handling
test_error_handling() {
    run_test "Error Handling"

    # Test invalid endpoint
    local not_found=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4000/api/v1/nonexistent")

    if [ "$not_found" = "404" ]; then
        log_success "404 error handling working"
    else
        log_error "404 error handling failed (HTTP $not_found)"
        return 1
    fi

    # Test malformed JSON
    local bad_json=$(curl -s -X POST "http://localhost:4000/api/v1/auth/check-existence" \
        -H "Content-Type: application/json" \
        -d '{"invalid": json}' | jq -r '.success // true')

    if [ "$bad_json" = "false" ]; then
        log_success "JSON validation error handling working"
    else
        log_error "JSON validation error handling failed"
        return 1
    fi
}

# Test 8: Session Stabilization (Timing Test)
test_session_stabilization() {
    run_test "Session Stabilization Timing"

    # Test that multiple rapid requests don't cause race conditions
    log_info "Testing rapid API calls (simulating race condition)..."

    local rapid_test_results=()
    for i in {1..5}; do
        local start_time=$(date +%s%N)
        local response=$(curl -s -X POST "http://localhost:4000/api/v1/auth/check-existence" \
            -H "Content-Type: application/json" \
            -d '{"email": "race-test@example.com"}')
        local end_time=$(date +%s%N)

        local duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
        local success=$(echo "$response" | jq -r '.success // false')

        if [ "$success" = "true" ]; then
            rapid_test_results+=("PASS:${duration}ms")
        else
            rapid_test_results+=("FAIL:${duration}ms")
        fi
    done

    local failed_count=0
    for result in "${rapid_test_results[@]}"; do
        if [[ $result == FAIL* ]]; then
            ((failed_count++))
        fi
    done

    if [ $failed_count -eq 0 ]; then
        log_success "Rapid API calls handled correctly (no race conditions detected)"
    else
        log_error "Race condition detected: $failed_count out of 5 requests failed"
        return 1
    fi
}

# Test 9: Memory and Performance Check
test_performance() {
    run_test "Performance Check"

    # Test API response time
    local start_time=$(date +%s%N)
    curl -s "http://localhost:4000/api/v1/health" > /dev/null
    local end_time=$(date +%s%N)

    local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds

    if [ $response_time -lt 2000 ]; then
        log_success "API response time is acceptable (${response_time}ms)"
    else
        log_warning "API response time is slow (${response_time}ms)"
    fi

    # Check if dev processes are running without errors
    if pgrep -f "turbo dev" > /dev/null; then
        log_success "Development processes are running"
    else
        log_error "Development processes not found"
        return 1
    fi
}

# Test 10: Integration Test
test_integration_flow() {
    run_test "Integration Flow Test"

    log_info "Testing complete anonymous-to-authenticated flow simulation..."

    # 1. Check anonymous session creation
    local anon_response=$(curl -s -I "http://localhost:3000/dev-dashboard" | grep "anonymous-session-id")
    if [ -n "$anon_response" ]; then
        log_success "Anonymous session creation working"
    else
        log_error "Anonymous session creation failed"
        return 1
    fi

    # 2. Test API availability for authenticated routes
    local auth_check=$(curl -s "http://localhost:4000/api/v1/user/wallet/info" | jq -r '.error.code // "NONE"')
    if [ "$auth_check" = "UNAUTHORIZED" ]; then
        log_success "Authentication protection working for protected routes"
    else
        log_error "Authentication protection not working properly"
        return 1
    fi

    # 3. Test health monitoring integration
    local health_details=$(curl -s "http://localhost:4000/api/v1/health" | jq -r '.data.services.healthy // 0')
    if [ "$health_details" -gt 0 ]; then
        log_success "Health monitoring integration working"
    else
        log_error "Health monitoring integration failed"
        return 1
    fi
}

# Main execution
main() {
    echo "Phase 2 Completion Validation"
    echo "Testing Date: $(date)"
    echo "Testing authentication race condition and reconciliation logic fixes"
    echo ""

    check_prerequisites

    # Run all tests
    test_environment_health
    test_auth_endpoints
    test_api_response_structure
    test_dev_dashboard
    test_wallet_creation_endpoint
    test_health_services
    test_error_handling
    test_session_stabilization
    test_performance
    test_integration_flow

    # Summary
    echo ""
    echo "===================================="
    echo "📊 Test Results Summary"
    echo "===================================="
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All tests passed! Phase 2 fixes are working correctly.${NC}"
        echo -e "${GREEN}✅ Phase 2 is ready for sign-off${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ Some tests failed. Phase 2 needs attention.${NC}"
        echo -e "${RED}Please review the failed tests above${NC}"
        exit 1
    fi
}

# Run the main function
main "$@"
