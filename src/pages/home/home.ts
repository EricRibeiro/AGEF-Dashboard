import { Chart } from 'chart.js';
import { Component, ViewChild } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Socket } from 'ng-socket-io';
import * as palette from 'google-palette';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild('canvasPizza') canvasPizza;

  graficoPizza: any;

  constructor(
    public navCtrl: NavController,
    public socket: Socket) {

    this.getMessages().subscribe(message => {
      console.log(message);
    });

  }

  ionViewDidLoad() {
    let lojas: any[] = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"];
    let vendas = [12, 19, 3, 5, 2, 3];

    this.exibirGrafico(lojas, vendas);
  }

  ionViewWillEnter() {
    this.socket.connect();
  }

  ionViewWillLeave() {
    this.socket.disconnect();
  }

  public exibirGrafico(lojas: string[], vendas: number[]): void {
    Chart.defaults.global.legend.display = false;

    this.graficoPizza = new Chart(this.canvasPizza.nativeElement, {
      type: 'pie',
      data: {
        labels: lojas,
        datasets: [{
          data: vendas,
          backgroundColor: palette('cb-Set3', vendas.length).map(function (hex) {
            return '#' + hex;
          })
        }],
      },

    });
  }

  public getMessages(): Observable<any> {
    let observable = new Observable(observer => {
      this.socket.on('message', (data) => {
        observer.next(data);
      });
    })

    return observable;
  }


}