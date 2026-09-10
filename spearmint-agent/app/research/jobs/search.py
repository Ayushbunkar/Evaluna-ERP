from typing import Any

from app.research.providers.jobs_provider import get_job_provider


async def search_jobs(company_name: str, domain: str) -> list[dict[str, Any]]:
    """
    Finds job hiring profiles and opportunities on the configured JobProvider.
    """
    provider = get_job_provider()
    records = await provider.search_jobs(company_name=company_name, domain=domain)
    return [rec.dict() for rec in records]
