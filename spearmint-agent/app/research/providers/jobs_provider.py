from datetime import datetime

from app.research.base import JobProvider
from app.research.schemas import JobRecord


class MockJobProvider(JobProvider):
    async def search_jobs(self, company_name: str, domain: str) -> list[JobRecord]:
        """Deterministic mock job provider for testing."""
        return [
            JobRecord(
                title="Senior Backend Engineer (Python)",
                location="Remote, US",
                department="Engineering",
                url=f"https://{domain}/careers/backend-eng",
                source="MockJobProvider",
                published_at="2026-03-01T00:00:00Z",
                retrieved_at=datetime.utcnow().isoformat() + "Z",
                metadata={"salary_range": "$140,000 - $180,000"}
            ),
            JobRecord(
                title="Product Manager",
                location="San Francisco, CA",
                department="Product Management",
                url=f"https://{domain}/careers/pm",
                source="MockJobProvider",
                published_at="2026-03-05T00:00:00Z",
                retrieved_at=datetime.utcnow().isoformat() + "Z",
                metadata={"experience_years": "5+"}
            )
        ]

def get_job_provider() -> JobProvider:
    """
    Factory function for the configured JobProvider.
    """
    # Always falls back to Mock for Phase 3
    return MockJobProvider()
