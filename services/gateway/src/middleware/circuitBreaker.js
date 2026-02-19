import CircuitBreaker from 'opossum';

const breakerOptions = {
  timeout: 15000,          // 15s to match proxy timeout
  errorThresholdPercentage: 50,
  resetTimeout: 30000,     // 30s before retry
  rollingCountTimeout: 10000,
  capacity: 100,
  volumeThreshold: 10
};

const breakers = new Map();

export function createCircuitBreaker(serviceName, makeRequest) {
  if (!breakers.has(serviceName)) {
    const breaker = new CircuitBreaker(makeRequest, {
      ...breakerOptions,
      name: serviceName
    });
    
    breaker.fallback(() => ({
      status: 503,
      body: { message: `${serviceName} temporarily unavailable`, code: 'SERVICE_UNAVAILABLE' }
    }));
    
    breaker.on('open', () => console.warn(`⚠️  Circuit ${serviceName} opened`));
    breaker.on('halfOpen', () => console.info(`🔄 Circuit ${serviceName} half-open`));
    breaker.on('close', () => console.info(`✅ Circuit ${serviceName} closed`));
    
    breakers.set(serviceName, breaker);
  }
  return breakers.get(serviceName);
}

export function getAllBreakers() {
  return breakers;
}

export function getBreakerStats() {
  const stats = {};
  for (const [name, breaker] of breakers.entries()) {
    stats[name] = {
      state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
      stats: breaker.stats
    };
  }
  return stats;
}
