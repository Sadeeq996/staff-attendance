import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { User } from 'src/app/models/user';
import { firstValueFrom } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { MockDataService } from 'src/app/services/mock-data.service';
import { AuditService } from 'src/app/services/audit.service';
import { UserModalPage } from '../user-modal/user-modal.page';

@Component({
    selector: 'app-admin-users',
    templateUrl: './admin-users.page.html',
    styleUrls: ['./admin-users.page.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule, FormsModule]
})
export class AdminUsersPage {
    users: User[] = [];
    filtered: User[] = [];
    roleFilter: '' | User['role'] | 'all' = '';
    hospitalFilter: string | '' = '';
    hospitals: any[] = [];

    private userService = inject(UserService);
    private mock = inject(MockDataService);
    private modalCtrl = inject(ModalController);
    private toastCtrl = inject(ToastController);
    private audit = inject(AuditService);

    constructor() {
        this.hospitals = this.mock.getHospitals();
        console.log('hospitals', this.hospitals)
        this.refresh();
    }

    async refresh() {
        this.users = await firstValueFrom(this.userService.list$());
        this.applyFilters();
    }

    applyFilters() {
        let arr = [...this.users];
        if (this.roleFilter && this.roleFilter !== 'all') {
            arr = arr.filter(u => u.role === this.roleFilter);
        }
        if (this.hospitalFilter) {
            console.log('hospital filter applied');
            arr = arr.filter(u => u.hospitalId === (this.hospitalFilter));
            console.log('hosp users: ', arr)
        }
        this.filtered = arr;
    }

    async openCreate() {
        const modal = await this.modalCtrl.create({ component: UserModalPage, componentProps: { mode: 'create' } });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data?.user) {
            try {
                const created = await firstValueFrom(this.userService.create$(data.user));
                this.audit.log({ actorId: undefined, action: 'create_user', resourceType: 'user', resourceId: created.id, after: created });
                this.showToast('User created');
                this.refresh();
            } catch (e: any) {
                this.showToast(e.message || 'Failed to create user');
            }
        }
    }

    async openEdit(u: User) {
        const modal = await this.modalCtrl.create({ component: UserModalPage, componentProps: { mode: 'edit', user: u } });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data?.user) {
            try {
                const before = { ...u };
                const updated = await firstValueFrom(this.userService.update$(u.id, data.user));
                this.audit.log({ actorId: undefined, action: 'update_user', resourceType: 'user', resourceId: u.id, before, after: updated });
                this.showToast('User updated');
                this.refresh();
            } catch (e: any) {
                this.showToast(e.message || 'Failed to update user');
            }
        }
    }

    async deleteUser(u: User) {
        if (!confirm(`Delete user ${u.email}? This action cannot be undone.`)) return;
        await firstValueFrom(this.userService.delete$(u.id));
        this.audit.log({ actorId: undefined, action: 'delete_user', resourceType: 'user', resourceId: u.id, before: u });
        this.showToast('User deleted');
        this.refresh();
    }

    private async showToast(msg: string) {
        const t = await this.toastCtrl.create({ message: msg, duration: 2000 });
        await t.present();
    }
}
