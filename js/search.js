document.addEventListener('DOMContentLoaded', function() {
    let searchData = {
        businesses: [],
        categories: [],
        tags: []
    };

    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    // Debug logging
    console.log('Search elements:', { searchInput, searchResults });

    if (!searchInput || !searchResults) {
        console.error('Search elements not found!');
        return;
    }

    // Fetch the search index
    fetch('/index.json')
        .then(response => response.json())
        .then(data => {
            searchData = data;
            console.log('Search data loaded:', searchData); // Debug log
        })
        .catch(error => console.error('Error loading search index:', error));

    let debounceTimer;

    // Search functionality with debounce
    searchInput.addEventListener('input', function(e) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value.toLowerCase().trim();
            
            if (query === '') {
                searchResults.style.display = 'none';
                return;
            }

            // Show loading state
            searchResults.style.display = 'block';
            searchResults.innerHTML = '<div class="search-loading">Searching...</div>';

            // Filter categories first (showing all categories if query is empty)
            const filteredCategories = query === '' 
                ? searchData.categories 
                : searchData.categories.filter(category => 
                    category.toLowerCase().includes(query)
                );

            // Filter businesses
            const filteredBusinesses = searchData.businesses.filter(item => {
                const titleMatch = item.title?.toLowerCase().includes(query);
                const contentMatch = item.content?.toLowerCase().includes(query);
                const categoryMatch = item.categories?.some(cat => cat.toLowerCase().includes(query));
                const tagMatch = item.tags?.some(tag => tag.toLowerCase().includes(query));
                return titleMatch || contentMatch || categoryMatch || tagMatch;
            }).slice(0, 5); // Limit to 5 results
            
            // Filter tags
            const filteredTags = searchData.tags
                .filter(tag => tag.toLowerCase().includes(query))
                .slice(0, 5); // Limit to 5 results

            // Display results with categories always shown
            displaySearchResults(filteredBusinesses, filteredCategories, filteredTags, query);
        }, 300); // 300ms debounce
    });

    // Helper function to transform URLs consistently
    function transformForUrl(str) {
        return str.toLowerCase()
            .replace(/\s*&\s*/g, '--')  // Replace & and surrounding spaces with --
            .replace(/\s+/g, '-');      // Replace remaining spaces with single -
    }

    function displaySearchResults(businesses, categories, tags, query) {
        searchResults.innerHTML = '';

        // Always display categories
        const categorySection = document.createElement('div');
        categorySection.className = 'search-section';
        categorySection.innerHTML = `
            <div class="search-section__title">Categories</div>
            ${categories.map(category => `
                <a href="/categories/${transformForUrl(category)}/" class="search-result search-result--category">
                    <div class="search-result__title">
                        <svg class="search-result__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        ${category}
                    </div>
                </a>
            `).join('')}
        `;
        searchResults.appendChild(categorySection);

        // Display businesses if any
        if (businesses.length > 0) {
            const businessSection = document.createElement('div');
            businessSection.className = 'search-section';
            businessSection.innerHTML = `
                <div class="search-section__title">Businesses</div>
                ${businesses.map(business => `
                    <a href="${business.permalink}" class="search-result">
                        <div class="search-result__image">
                            ${business.image 
                                ? `<img src="${business.image}" alt="${business.title}" loading="lazy">` 
                                : `<div class="search-result__image-placeholder"></div>`
                            }
                        </div>
                        <div class="search-result__content">
                            <div class="search-result__title">${business.title}</div>
                            ${business.categories && business.categories.length > 0 
                                ? `<div class="search-result__category">${business.categories.join(', ')}</div>` 
                                : ''
                            }
                            ${business.tags && business.tags.length > 0 
                                ? `<div class="search-result__tags">
                                    ${business.tags.slice(0, 3).map(tag => 
                                        `<span class="search-result__tag">${tag}</span>`
                                    ).join('')}
                                    ${business.tags.length > 3 ? `<span class="search-result__tag">+${business.tags.length - 3}</span>` : ''}
                                </div>`
                                : ''
                            }
                        </div>
                    </a>
                `).join('')}
            `;
            searchResults.appendChild(businessSection);
        }

        // Display tags if any
        if (tags.length > 0) {
            const tagSection = document.createElement('div');
            tagSection.className = 'search-section';
            tagSection.innerHTML = `
                <div class="search-section__title">Tags</div>
                ${tags.map(tag => `
                    <a href="/tags/${transformForUrl(tag)}" class="search-result search-result--category">
                        <div class="search-result__title">
                            <svg class="search-result__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M7 4L4 14M12 4L9 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            ${tag}
                        </div>
                    </a>
                `).join('')}
            `;
            searchResults.appendChild(tagSection);
        }

        // Show no results message if nothing found
        if (businesses.length === 0 && tags.length === 0 && categories.length === 0) {
            searchResults.innerHTML = '<div class="search-result__empty">No results found</div>';
        }

        searchResults.style.display = 'block';
    }

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    // Prevent search results from closing when clicking inside
    searchResults.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Show search results when focusing on input
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim() !== '') {
            searchResults.style.display = 'block';
        }
    });
});
