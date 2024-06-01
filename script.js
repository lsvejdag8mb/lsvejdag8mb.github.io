document.addEventListener('DOMContentLoaded', () => {
    class Event {
        constructor(title, day, start, end, type, capacity) {
            this.title = title;
            this.day = day;
            this.start = start;
            this.end = end;
            this.type = type;
            this.capacity = capacity;
        }

        save() {
            const eventKey = `event-${this.day}-${this.start}`;
            localStorage.setItem(eventKey, JSON.stringify(this));
        }

        static delete(eventKey) {
            localStorage.removeItem(eventKey);
        }

        static loadAll() {
            const events = [];
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('event-')) {
                    const eventDetails = JSON.parse(localStorage.getItem(key));
                    events.push(new Event(eventDetails.title, eventDetails.day, eventDetails.start, eventDetails.end, eventDetails.type, eventDetails.capacity));
                }
            });
            return events;
        }
    }

    class Calendar {
        constructor() {
            this.firstDayDate = new Date();
            if (this.firstDayDate.getDay() === 0) { // Sunday
                this.firstDayDate.setDate(this.firstDayDate.getDate() - 6);
            } else {
                this.firstDayDate.setDate(this.firstDayDate.getDate() - this.firstDayDate.getDay() + 1);
            }
            this.firstDayDate.setHours(0, 0, 0, 0);
            this.currDate = new Date();
            this.dayDate = new Date(this.firstDayDate);
            this.initialize();
            this.addEventListeners();
        }

        initialize() {
            this.fillHours();
            this.loadEvents();
        }

        fillDayHours(id, day) {
            let header = `<div class="day-header`;
            if (this.dayDate.toLocaleDateString() === this.currDate.toLocaleDateString()) {
                header += "-current";
            }
            header += `">${day} ${this.dayDate.toLocaleDateString()}</div>`;
            for (let i = 0; i < 16; i++) {
                header += `<div class="hour-cal"></div>`;
            }
            document.getElementById(id).innerHTML = header;
            this.dayDate.setDate(this.dayDate.getDate() + 1);
        }

        fillHours() {
            this.dayDate = new Date(this.firstDayDate);
            this.fillDayHours("dow1", "Pondělí");
            this.fillDayHours("dow2", "Úterý");
            this.fillDayHours("dow3", "Středa");
            this.fillDayHours("dow4", "Čtvrtek");
            this.fillDayHours("dow5", "Pátek");
            this.fillDayHours("dow6", "Sobota");
            this.fillDayHours("dow0", "Neděle");
        }

        loadEvents() {
            const events = Event.loadAll();
            events.forEach(event => this.addEventToCalendar(event));
        }

        addEventToCalendar(eventDetails) {
            let dtEvent = new Date(eventDetails.day);
            if (dtEvent.getTime() < this.firstDayDate.getTime() || dtEvent.getTime() > this.firstDayDate.getTime() + 7 * 24 * 3600 * 1000) {
                return;
            }
            const dayColumn = document.getElementById("dow" + dtEvent.getDay());
            if (dayColumn) {
                const dayHeaderHeight = dayColumn.firstChild.clientHeight;
                const start = dayHeaderHeight + this.parseTime(eventDetails.start) + 2;
                const end = dayHeaderHeight + this.parseTime(eventDetails.end) - 2;
                const duration = end - start;

                const eventElement = document.createElement('div');
                eventElement.setAttribute("eventKey", `event-${eventDetails.day}-${eventDetails.start}`)
                eventElement.classList.add('event');
                eventElement.textContent = `${eventDetails.title} (${eventDetails.start} - ${eventDetails.end})`;
                eventElement.style.top = `${start}px`;
                eventElement.style.height = `${duration - 2}px`;
                eventElement.setAttribute('draggable', 'true');
                eventElement.dataset.eventKey = `event-${eventDetails.day}-${eventDetails.start}`;
                eventElement.addEventListener('dragstart', this.handleDragStart.bind(this));
                eventElement.addEventListener('dragend', this.handleDragEnd.bind(this));
                dayColumn.appendChild(eventElement);
            }
        }

        parseTime(timeStr) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return ((hours - 6) * 60) + minutes;
        }

        handleDragStart(e) {
            e.dataTransfer.setData('text/plain', e.target.dataset.eventKey);
        }

        handleDragEnd(e) {
            const trashBinRect = document.getElementById('trash').getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            if (mouseX > trashBinRect.left &&
                mouseX < trashBinRect.right &&
                mouseY > trashBinRect.top &&
                mouseY < trashBinRect.bottom) {
                const confirmation = confirm("Do you really want to delete that?");
                if (confirmation) {
                    Event.delete(e.target.getAttribute("eventKey"));
                    e.target.remove();
                    this.playDeleteSound();
                }
            }
        }

        playDeleteSound() {
            const deleteSound = new Audio('delete-sound.mp3');
            deleteSound.play().then(r => {});
        }

        addEventListeners() {
            document.getElementById('prevWeek').addEventListener('click', () => {
                this.firstDayDate.setDate(this.firstDayDate.getDate() - 7);
                this.initialize();
            });

            document.getElementById('nextWeek').addEventListener('click', () => {
                this.firstDayDate.setDate(this.firstDayDate.getDate() + 7);
                this.initialize();
            });

            const trashBin = document.getElementById('trash');
            trashBin.addEventListener('dragenter', function () {
                trashBin.src = 'open-bin.png';
                trashBin.classList.add('bin-open');
            });

            trashBin.addEventListener('dragleave', function () {
                trashBin.src = 'closed-bin.png';
                trashBin.classList.remove('bin-open');
            });

            document.getElementById('newEvent').addEventListener('click', () => {
                const eventWin = document.getElementById('eventForm');
                if (eventWin.style.display === 'none' || eventWin.style.display === '') {
                    eventWin.style.display = 'block';
                } else {
                    eventWin.style.display = 'none';
                }
            });

            const smiley = document.getElementById('smiley');
            const mouth = smiley.querySelector('.mouth');

            smiley.addEventListener('mouseenter', () => {
                mouth.setAttribute('d', 'M20,40 Q32,50 44,40');
            });

            smiley.addEventListener('mouseleave', () => {
                mouth.setAttribute('d', 'M20,40 Q32,35 44,40');
            });
        }
    }

    class EventForm {
        constructor() {
            this.eventForm = document.getElementById('addEventForm');
            this.eventWin = document.getElementById('eventForm');
            this.eventTitle = document.getElementById('eventTitle');
            this.eventDay = document.getElementById('eventDay');
            this.eventStart = document.getElementById('eventStart');
            this.eventEnd = document.getElementById('eventEnd');
            this.eventType = document.getElementById('eventType');
            this.eventCapacity = document.getElementById('capacity');
            this.currDate = new Date();
            this.initForm();
        }

        initForm() {
            this.eventForm.addEventListener('submit', (event) => {
                this.handleSubmit(event);
            });
        }

        handleSubmit(event) {
            event.preventDefault();
            const startTime = this.eventStart.value;
            const endTime = this.eventEnd.value;

            if (startTime && endTime) {
                const start = new Date(`1970-01-01T${startTime}:00`);
                const end = new Date(`1970-01-01T${endTime}:00`);
                const difference = (end - start) / 60000; // difference in minutes

                if (difference < 15) {
                    alert('The end time must be at least 15 minutes after the start time.');
                } else {
                    const eventDetails = new Event(
                        this.eventTitle.value,
                        this.eventDay.value,
                        this.eventStart.value,
                        this.eventEnd.value,
                        this.eventType.value,
                        this.eventCapacity.value
                    );
                    eventDetails.save();
                    this.eventWin.style.display = 'none';
                    calendar.addEventToCalendar(eventDetails);
                    this.resetForm();
                }
            }
        }

        resetForm() {
            this.eventTitle.value = '';
            this.eventDay.value = this.currDate.toDateString();
            this.eventStart.value = '';
            this.eventEnd.value = '';
            this.eventType.value = 'Massage';
            this.eventCapacity.value = '';
        }
    }

    const calendar = new Calendar();
    const eventForm = new EventForm();
});