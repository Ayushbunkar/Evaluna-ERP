from app.research.base import PeopleProvider
from app.research.schemas import PeopleCandidate


class MockPeopleProvider(PeopleProvider):
    async def find_people(
        self, 
        company_name: str, 
        domain: str, 
        role_hints: list[str] | None = None
    ) -> list[PeopleCandidate]:
        """Deterministic mock people provider for testing."""
        all_candidates = [
            PeopleCandidate(
                name="John Doe",
                title="VP of Sales",
                department="Sales",
                linkedin_url="https://linkedin.com/in/johndoe-spearmint",
                profile_url=None,
                source="MockPeopleProvider",
                source_url=f"https://{domain}/team",
                confidence=0.9
            ),
            PeopleCandidate(
                name="Jane Smith",
                title="Chief Technology Officer",
                department="Engineering",
                linkedin_url="https://linkedin.com/in/janesmith-spearmint",
                profile_url=None,
                source="MockPeopleProvider",
                source_url=f"https://{domain}/about",
                confidence=0.95
            ),
            PeopleCandidate(
                name="Bob Johnson",
                title="Head of Growth",
                department="Marketing",
                linkedin_url="https://linkedin.com/in/bobjohnson-spearmint",
                profile_url=None,
                source="MockPeopleProvider",
                source_url=f"https://{domain}/leadership",
                confidence=0.85
            )
        ]
        
        if not role_hints:
            return all_candidates
            
        # Filter based on role hints
        filtered = []
        for c in all_candidates:
            if any(hint.lower() in c.title.lower() or hint.lower() in (c.department or "").lower() for hint in role_hints):
                filtered.append(c)
        return filtered

def get_people_provider() -> PeopleProvider:
    """
    Factory function for the configured PeopleProvider.
    """
    # Always falls back to Mock for Phase 3
    return MockPeopleProvider()
