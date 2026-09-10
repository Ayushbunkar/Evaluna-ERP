from abc import ABC, abstractmethod

from app.research.schemas import JobRecord, PeopleCandidate, WebSearchResult


class SearchProvider(ABC):
    @abstractmethod
    async def search_web(self, query: str, max_results: int = 10) -> WebSearchResult:
        """Execute a web search and return structured result items."""

class JobProvider(ABC):
    @abstractmethod
    async def search_jobs(self, company_name: str, domain: str) -> list[JobRecord]:
        """Search for job opportunities and hiring signals for a company."""

class PeopleProvider(ABC):
    @abstractmethod
    async def find_people(
        self, 
        company_name: str, 
        domain: str, 
        role_hints: list[str] | None = None
    ) -> list[PeopleCandidate]:
        """Find key decision-makers and candidates matching the role hints."""
