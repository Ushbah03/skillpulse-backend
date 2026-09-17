import prisma from './src/config/db.js';
import { getOrganizationSkillAnalytics } from './src/controllers/hrController.js';

async function testAnalyticsController() {
  const hrUser = await prisma.user.findFirst({
    where: { role: 'HR_MANAGER' }
  });

  console.log("Testing with HR User:", hrUser.email, "TenantId:", hrUser.tenantId);

  const req = { tenantId: hrUser.tenantId, user: hrUser };
  const res = {
    json: (data) => {
      console.log("API Response success:", data.success);
      console.log("Total Employees in analytics data:", data.data?.totalEmployees);
      console.log("Members array length:", data.data?.members?.length);
      console.log("Sample Members from DB:", data.data?.members?.slice(0, 3));
    }
  };
  const next = (err) => console.error("Error:", err);

  await getOrganizationSkillAnalytics(req, res, next);
  await prisma.$disconnect();
}

testAnalyticsController();
