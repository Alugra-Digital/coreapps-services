import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the CRM service
vi.mock('../src/services/crmService.js', () => ({
  getLeads: vi.fn(),
  createLead: vi.fn(),
  updateLead: vi.fn(),
  deleteLead: vi.fn(),
  getOpportunities: vi.fn(),
  createOpportunity: vi.fn(),
  updateOpportunity: vi.fn(),
  deleteOpportunity: vi.fn(),
}));

import * as crmService from '../src/services/crmService.js';
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  getOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
} from '../src/controllers/crmController.js';

function createMockReqRes(body = {}, params = {}) {
  const req = {
    body,
    params,
    user: { id: 1, role: 'SUPER_ADMIN', permissions: [] },
  };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

const testLead = {
  id: 1,
  name: 'PT Maju Jaya',
  company: 'PT Maju Jaya',
  email: 'info@majujaya.com',
  phone: '08123456789',
  status: 'NEW',
  source: 'Website',
  notes: 'Interested in ERP',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const testOpportunity = {
  id: 1,
  name: 'ERP Implementation',
  leadId: 1,
  clientId: null,
  amount: '500000000',
  probability: 60,
  stage: 'PROPOSAL',
  notes: 'Enterprise deal',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CRM Controller - Leads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /leads', () => {
    it('should return all leads', async () => {
      const { req, res } = createMockReqRes();
      crmService.getLeads.mockResolvedValue([testLead]);

      await getLeads(req, res);

      expect(crmService.getLeads).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith([testLead]);
    });

    it('should handle errors', async () => {
      const { req, res } = createMockReqRes();
      crmService.getLeads.mockRejectedValue(new Error('DB error'));

      await getLeads(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('POST /leads', () => {
    it('should create a lead with valid data', async () => {
      const leadData = {
        name: 'New Lead',
        email: 'lead@test.com',
        phone: '08111222333',
        source: 'Referral',
      };

      const { req, res } = createMockReqRes(leadData);
      crmService.createLead.mockResolvedValue({ id: 2, ...leadData });

      await createLead(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(crmService.createLead).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Lead' })
      );
    });

    it('should reject lead with empty name', async () => {
      const { req, res } = createMockReqRes({ name: '' });

      await createLead(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject lead with invalid email', async () => {
      const { req, res } = createMockReqRes({
        name: 'Test',
        email: 'not-an-email',
      });

      await createLead(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should accept lead with valid status', async () => {
      const leadData = { name: 'Lead', status: 'QUALIFIED' };
      const { req, res } = createMockReqRes(leadData);
      crmService.createLead.mockResolvedValue({ id: 3, ...leadData });

      await createLead(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should reject lead with invalid status', async () => {
      const { req, res } = createMockReqRes({
        name: 'Test',
        status: 'INVALID_STATUS',
      });

      await createLead(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('PATCH /leads/:id', () => {
    it('should update a lead', async () => {
      const { req, res } = createMockReqRes(
        { status: 'CONTACTED', notes: 'Follow up done' },
        { id: '1' }
      );
      crmService.updateLead.mockResolvedValue({ ...testLead, status: 'CONTACTED' });

      await updateLead(req, res);

      expect(crmService.updateLead).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'CONTACTED' }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'CONTACTED' }));
    });
  });

  describe('DELETE /leads/:id', () => {
    it('should delete a lead', async () => {
      const { req, res } = createMockReqRes({}, { id: '1' });
      crmService.deleteLead.mockResolvedValue(undefined);

      await deleteLead(req, res);

      expect(crmService.deleteLead).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});

describe('CRM Controller - Opportunities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /opportunities', () => {
    it('should return all opportunities', async () => {
      const { req, res } = createMockReqRes();
      crmService.getOpportunities.mockResolvedValue([testOpportunity]);

      await getOpportunities(req, res);

      expect(res.json).toHaveBeenCalledWith([testOpportunity]);
    });
  });

  describe('POST /opportunities', () => {
    it('should create opportunity with valid data', async () => {
      const oppData = {
        name: 'New Deal',
        amount: 100000000,
        probability: 30,
        stage: 'PROSPECTING',
      };

      const { req, res } = createMockReqRes(oppData);
      crmService.createOpportunity.mockResolvedValue({ id: 2, ...oppData });

      await createOpportunity(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should reject opportunity with invalid stage', async () => {
      const { req, res } = createMockReqRes({
        name: 'Test',
        amount: 100,
        probability: 50,
        stage: 'INVALID_STAGE',
      });

      await createOpportunity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject opportunity with probability > 100', async () => {
      const { req, res } = createMockReqRes({
        name: 'Test',
        amount: 100,
        probability: 150,
      });

      await createOpportunity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject opportunity with negative amount', async () => {
      const { req, res } = createMockReqRes({
        name: 'Test',
        amount: -100,
        probability: 50,
      });

      await createOpportunity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('PATCH /opportunities/:id', () => {
    it('should update opportunity stage', async () => {
      const { req, res } = createMockReqRes(
        { stage: 'NEGOTIATION' },
        { id: '1' }
      );
      crmService.updateOpportunity.mockResolvedValue({
        ...testOpportunity,
        stage: 'NEGOTIATION',
      });

      await updateOpportunity(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ stage: 'NEGOTIATION' })
      );
    });
  });

  describe('DELETE /opportunities/:id', () => {
    it('should delete an opportunity', async () => {
      const { req, res } = createMockReqRes({}, { id: '1' });
      crmService.deleteOpportunity.mockResolvedValue(undefined);

      await deleteOpportunity(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});

describe('Lead Lifecycle', () => {
  it('should define valid lead statuses', () => {
    const validStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED'];
    expect(validStatuses).toHaveLength(5);
  });

  it('should define valid opportunity stages', () => {
    const validStages = [
      'PROSPECTING', 'QUALIFICATION', 'PROPOSAL',
      'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST',
    ];
    expect(validStages).toHaveLength(6);
  });
});
