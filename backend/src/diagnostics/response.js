export function diagnosticResponse(status, code, message, severity = 'error') {
  return {
    status,
    executed: false,
    results: [],
    diagnostics: [{ code, message, severity, stage: 'request', line: null, column: null }]
  };
}
