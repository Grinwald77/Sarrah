export const TopSecondaryBlock = {

    init() {
    this.container = document.getElementById('topSecondaryBlock');
        this.render();
        this.bind();
    },

    render() {
        const store = window.store || {};

        this.container.innerHTML = `
            <div class="top-secondary">

                <div class="top-secondary__field">
                    <label>Название вида деятельности</label>
                    <input 
                        type="text" 
                        id="activityName"
                        value="${store.activityName || ''}"
                    />
                </div>

                <div class="top-secondary__field">
                    <label>Количество групп</label>
                    <input 
                        type="number" 
                        id="groupCount"
                        min="1"
                        max="50"
                        value="${store.groupCount || 5}"
                    />
                </div>

            </div>
        `;
    },

    bind() {
        document.getElementById('activityName')
            .addEventListener('input', (e) => {
                window.store.activityName = e.target.value;
            });

        document.getElementById('groupCount')
            .addEventListener('input', (e) => {
                window.store.groupCount = parseInt(e.target.value) || 1;
            });
    }
};
