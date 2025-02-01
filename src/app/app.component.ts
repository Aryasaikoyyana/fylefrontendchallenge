import { Component, OnInit, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface WorkoutEntry {
  userName: string;
  workoutType: string;
  workoutMinutes: number;
}

@Component({
  selector: 'app-root',
  template: `
  <div class="container">
  <header class="main-header">
    <h1>Health Challenge Tracker</h1>
  </header>

  <form #workoutForm="ngForm" (ngSubmit)="onSubmit(workoutForm)" class="input-form">
    <div class="form-center-group">
      <div class="form-field">
        <label for="userName">User Name*</label>
        <input type="text" id="userName" name="userName" [(ngModel)]="userName" required>
      </div>
      
      <div class="form-vertical">
        <div class="form-field">
          <label for="workoutType">Workout Type*</label>
          <select id="workoutType" name="workoutType" [(ngModel)]="workoutType" required>
            <option value="">Select a workout type</option>
            <option *ngFor="let type of availableWorkoutTypes" [value]="type">{{type}}</option>
          </select>
        </div>
        
        <div class="form-field">
          <label for="workoutMinutes">Workout Minutes*</label>
          <input type="number" id="workoutMinutes" name="workoutMinutes" [(ngModel)]="workoutMinutes" required>
        </div>
      </div>
      
      <button type="submit" class="submit-btn" [disabled]="!workoutForm.form.valid">Add Workout</button>
    </div>
  </form>

  <div class="data-section">
    <div class="filter-controls">
      <input type="text" placeholder="Search by name" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" class="search-field">
      <select [(ngModel)]="filterType" (ngModelChange)="applyFilters()" class="type-select">
        <option value="">All Workout Types</option>
        <option *ngFor="let type of availableWorkoutTypes" [value]="type">{{type}}</option>
      </select>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Workouts</th>
          <th>Number of Workouts</th>
          <th>Total Workout Minutes</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let entry of paginatedEntries">
          <td>{{entry.userName}}</td>
          <td>{{entry.workoutType}}</td>
          <td>{{getNumberOfWorkouts(entry.userName)}}</td>
          <td>{{getTotalWorkoutMinutes(entry.userName)}}</td>
        </tr>
      </tbody>
    </table>

    <div class="table-footer">
      <div class="pagination-controls">
        <button class="page-btn" (click)="changePage(-1)" [disabled]="currentPage === 1">&lt;</button>
        <span class="page-info">Page {{currentPage}} of {{totalPages}}</span>
        <button class="page-btn" (click)="changePage(1)" [disabled]="currentPage === totalPages">&gt;</button>
      </div>
      <select class="page-select" [(ngModel)]="itemsPerPage" (ngModelChange)="applyFilters()">
        <option [value]="5">5 per page</option>
        <option [value]="10">10 per page</option>
        <option [value]="20">20 per page</option>
      </select>
    </div>
  </div>

  <div class="user-progress-section">
    <div class="user-list-panel">
      <h2>Users</h2>
      <ul class="user-list">
        <li *ngFor="let user of getUniqueUsers()"
            (click)="selectUser(user)"
            [class.active-user]="user === selectedUser">
          {{user}}
        </li>
      </ul>
    </div>
    <div class="chart-panel" *ngIf="selectedUser">
      <h2>{{selectedUser}}'s Workout Progress</h2>
      <canvas id="chartCanvas"></canvas>
    </div>
  </div>
</div>

<style>
/* Base styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: white !important;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  font-family: Arial, sans-serif;
}

/* Header styling */
.main-header {
  background: #1A237E; /* Dark blue */
  padding: 40px 20px;
  margin-bottom: 30px;
  text-align: center;
}

.main-header h1 {
  color: white;
  font-size: 2.5em;
  font-weight: bold;
  letter-spacing: 1px;
}

/* Form styling */
.input-form {
  background: white;
  max-width: 500px;
  margin: 0 auto 40px;
  padding: 0 20px;
}

.form-center-group {
  text-align: center;
}

.form-field {
  margin-bottom: 25px;
  width: 100%;
}

.form-field label {
  display: block;
  margin-bottom: 10px;
  color: #000000;
  font-weight: 600;
  font-size: 16px;
}

.form-field input,
.form-field select {
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  padding: 12px;
  border: 1px solid #cccccc;
  border-radius: 4px;
  display: block;
  background: white;
  color: #000000;
  font-size: 14px;
}

.form-vertical {
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin: 25px 0;
}

.submit-btn {
  background: #1A237E;
  color: white;
  padding: 14px 40px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 15px;
}

/* Data section styling */
.data-section {
  background: white;
  padding: 25px;
}

.filter-controls {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  justify-content: flex-start;
}

.search-field,
.type-select {
  padding: 10px 15px;
  border: 1px solid #cccccc;
  border-radius: 4px;
  width: 220px;
  background: white;
  color: #000000;
}

/* Table styling */
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  background: white;
}

.data-table th,
.data-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #cccccc;
  color: #000000; /* Black text */
}

.data-table th {
  font-weight: 700;
  background: white;
}

/* Pagination styling */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.page-btn {
  padding: 8px 15px;
  border: 1px solid #cccccc;
  border-radius: 4px;
  background: white;
  color: #000000;
  cursor: pointer;
}

/* User list styling */
.user-list-panel {
  background: white;
  border: 1px solid #cccccc;
  border-radius: 4px;
  padding: 20px;
}

.user-list li {
  padding: 12px 15px;
  margin-bottom: 8px;
  border-radius: 4px;
  background: white;
  border: 1px solid #cccccc;
  color: #000000;
  cursor: pointer;
}

.active-user {
  background: #1A237E !important;
  color: white !important;
  border-color: #1A237E !important;
}

/* Chart panel styling */
.chart-panel {
  background: white;
  border: 1px solid #cccccc;
  border-radius: 4px;
  padding: 20px;
}

/* Remove all yellow tints */
input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0px 1000px white inset;
  -webkit-text-fill-color: #000000;
}
</style>
  `,
  styles: [`
    .container { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
    .form-group { margin-bottom: 15px; }
    .form-row { display: flex; gap: 15px; }
    .form-row .form-group { flex: 1; }
    label { display: block; margin-bottom: 5px; color: #666; }
    input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    button { padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:disabled { background-color: #cccccc; }
    .workout-list { margin-top: 30px; }
    .filters { display: flex; gap: 15px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
    .pagination span { margin: 0 10px; }
    .pagination select { margin-left: 10px; }
    .workout-progress { display: flex; margin-top: 30px; }
    .user-list { width: 200px; margin-right: 20px; }
    .user-list ul { list-style-type: none; padding: 0; }
    .user-list li { padding: 10px; cursor: pointer; border-bottom: 1px solid #ddd; }
    .user-list li.selected { background-color: #e0e0e0; }
    .chart-container { flex-grow: 1; }
    canvas { width: 100% !important; height: 300px !important; }
  `]
})
export class AppComponent implements OnInit {
  userName: string = '';
  workoutType: string = '';
  workoutMinutes: number = 0;
  workoutEntries: WorkoutEntry[] = [];
  filteredEntries: WorkoutEntry[] = [];
  paginatedEntries: WorkoutEntry[] = [];
  selectedUser: string | null = null;
  chart: Chart | null = null;

  searchTerm: string = '';
  filterType: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  availableWorkoutTypes: string[] = [
    'Running', 'Walking', 'Cycling', 'Swimming', 'Weightlifting',
    'Yoga', 'Pilates', 'HIIT', 'Dance', 'Martial Arts'
  ];

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.loadFromLocalStorage();
    this.applyFilters();
  }

  loadFromLocalStorage() {
    const storedData = localStorage.getItem('workoutEntries');
    if (storedData) {
      this.workoutEntries = JSON.parse(storedData);
    } else {
      // Initialize with sample data if localStorage is empty
      this.workoutEntries = [
        { userName: 'John Doe', workoutType: 'Running', workoutMinutes: 30 },
        { userName: 'John Doe', workoutType: 'Cycling', workoutMinutes: 45 },
        { userName: 'Jane Smith', workoutType: 'Swimming', workoutMinutes: 60 },
        { userName: 'Jane Smith', workoutType: 'Running', workoutMinutes: 20 },
        { userName: 'Mike Johnson', workoutType: 'Yoga', workoutMinutes: 50 },
        { userName: 'Mike Johnson', workoutType: 'Cycling', workoutMinutes: 40 }
      ];
      this.saveToLocalStorage();
    }
  }

  saveToLocalStorage() {
    localStorage.setItem('workoutEntries', JSON.stringify(this.workoutEntries));
  }

  onSubmit(form: NgForm | any) {
    if (form.valid) {
      this.workoutEntries.push({
        userName: this.userName,
        workoutType: this.workoutType,
        workoutMinutes: this.workoutMinutes
      });
      this.saveToLocalStorage();
      this.applyFilters();
      this.selectUser(this.userName);
      this.resetForm(form);
    }
  }

  resetForm(form: NgForm | any) {
    if (form.resetForm && typeof form.resetForm === 'function') {
      form.resetForm();
    }
    // Reset component properties
    this.userName = '';
    this.workoutType = '';
    this.workoutMinutes = 0;
  }

  getUniqueUsers(): string[] {
    return Array.from(new Set(this.workoutEntries.map(entry => entry.userName)));
  }

  selectUser(user: string) {
    this.selectedUser = user;
    this.updateChart();
  }

  updateChart() {
    if (this.selectedUser) {
      const canvas = this.elementRef.nativeElement.querySelector('#chartCanvas');
      if (!canvas) return;

      const userEntries = this.workoutEntries.filter(entry => entry.userName === this.selectedUser);
      const workoutData: { [key: string]: number } = {};

      userEntries.forEach(entry => {
        if (workoutData[entry.workoutType]) {
          workoutData[entry.workoutType] += entry.workoutMinutes;
        } else {
          workoutData[entry.workoutType] = entry.workoutMinutes;
        }
      });

      const labels = Object.keys(workoutData);
      const data = Object.values(workoutData);

      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Workout Minutes',
            data: data,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  applyFilters() {
    this.filteredEntries = this.workoutEntries.filter(entry => {
      const nameMatch = entry.userName.toLowerCase().includes(this.searchTerm.toLowerCase());
      const typeMatch = this.filterType ? entry.workoutType === this.filterType : true;
      return nameMatch && typeMatch;
    });
    this.totalPages = Math.ceil(this.filteredEntries.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePaginatedEntries();
  }

  updatePaginatedEntries() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedEntries = this.filteredEntries.slice(startIndex, startIndex + this.itemsPerPage);
  }

  changePage(delta: number) {
    this.currentPage += delta;
    this.updatePaginatedEntries();
  }

  getNumberOfWorkouts(userName: string): number {
    return this.workoutEntries.filter(entry => entry.userName === userName).length;
  }

  getTotalWorkoutMinutes(userName: string): number {
    return this.workoutEntries
      .filter(entry => entry.userName === userName)
      .reduce((total, entry) => total + entry.workoutMinutes, 0);
  }
}