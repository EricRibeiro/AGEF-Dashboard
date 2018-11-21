import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';

@Injectable()
export class DialogService {

    constructor(private toastCtrl: ToastController) {
    }

    exibirToast(mensagem: string) {
        let toast = this.toastCtrl.create({
            message: mensagem,
            duration: 2000,
            position: 'bottom',
            showCloseButton: true,
            closeButtonText: "OK"
        });

        toast.present();
    }
}