export function renderTopSecondary(container, store, onChange) {
    container.innerHTML = `
        <div class="top-secondary">
            
            <div class="top-secondary__field">
                <label>Название вида деятельности</label>
                <input 
                    type="text" 
                    value="${store.activityName || ''}" 
                    data-field="activityName"
                />
            </div>

            <div class="top-secondary__field">
                <label>Количество групп</label>
                <input 
                    type="number" 
                    min="1" 
                    max="50"
                    value="${store.groupCount || 5}" 
                    data-field="groupCount"
                />
            </div>

        </div>
    `;

    container.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
            const field = e.target.dataset.field;
            let value = e.target.value;

            if (field === 'groupCount') {
                value = parseInt(value) || 1;
            }

            onChange(field, value);
        });
    });
}
