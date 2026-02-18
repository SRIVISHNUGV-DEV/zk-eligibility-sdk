import { expect } from 'chai';
import { makeRuleId, submitProofOnChain } from '../src/sdk/eth';

describe('SDK on-chain helper (placeholder tests)', () => {
  it('computes rule id for known name', () => {
    const id = makeRuleId('WALLET_AGE');
    expect(id).to.be.a('string');
  });

  it('submitProofOnChain is exported', () => {
    expect(submitProofOnChain).to.be.a('function');
  });
});
