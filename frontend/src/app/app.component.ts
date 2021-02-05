import { Component, Inject, OnInit } from '@angular/core';
import { ethers, BigNumber, Contract } from 'ethers';
import * as EthergotchiArtifact from '../../../build/contracts/EthergotchiGlobal.json';
import Avatars from '@dicebear/avatars';
import sprites from '@dicebear/avatars-human-sprites';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare var window: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  private contractReadOnly: Contract;
  private daiWithSigner: any;

  public gotchis: IEthergotchi[] = [];
  public currentAddressName = 'Loading..';

  constructor(private sanitizer: DomSanitizer) {
  }

  public async addGotchi(gotchiName: string): Promise<void> {
    if (gotchiName !== '') {
      const createTaskJob = await this.daiWithSigner.generateEthergotchi(
        ethers.utils.formatBytes32String(gotchiName),
        { value: ethers.utils.parseEther('0.001') }
      );
      await createTaskJob.wait();
      gotchiName = '';
      await this.loadGotchis();
    }
  }

  public async changeName(newName: string): Promise<void> {
    if (newName !== '') {
      const createTaskJob = await this.daiWithSigner.setCurrentName(newName);
      await createTaskJob.wait();
      newName = '';
      this.updateNameDisplay();
    }
  }

  public async remove(id: number): Promise<void> {
    const createTaskJob = await this.daiWithSigner.remove(id);
    await createTaskJob.wait();
    await this.loadGotchis();
  }

  public async feed(id: number): Promise<void> {
    const createTaskJob = await this.daiWithSigner.feed(id);
    await createTaskJob.wait();
    await this.loadGotchis();
  }

  public async updateNameDisplay(): Promise<void> {
    this.currentAddressName = await this.daiWithSigner.getCurrentName();
  }
  /*
    public async save(): Promise<void> {
      const updateTasksJob = await this.daiWithSigner.updateTasks(this.parseBackTasks(this.tasks));
      await updateTasksJob.wait();
      await this.loadGotchis();
    }*/

  public async loadGotchis(): Promise<void> {
    this.updateNameDisplay();
    const rawGotchis = await this.contractReadOnly.getEthergotchis();
    const tempGotchis: IEthergotchi[] = [];
    for (const gotchi of rawGotchis) {
      const newGotchi = {
        id: gotchi.id.toNumber(),
        name: ethers.utils.parseBytes32String(gotchi.name),
        level: gotchi.level.toNumber(),
        birthTimestamp: gotchi.birthTimestamp.toNumber(),
        lastFeedTimestamp: gotchi.lastFeedTimestamp.toNumber(),
        lastPetTimestamp: gotchi.lastPetTimestamp.toNumber(),
        seed:  gotchi.seed.toNumber(),
        isDead: gotchi.isDead
      } as IEthergotchi;

      tempGotchis.push(newGotchi);
    }
    this.gotchis = tempGotchis;
  }

  public getYearsOld(gotchi: IEthergotchi): string {
    return this.timeSinceString(this.toDateTime(gotchi.birthTimestamp));
  }

  public toDateTime(secs): Date {
    const t = new Date(1970, 0, 1); // Epoch
    t.setSeconds(secs);
    return t;
  }

  public getSVG(gotchi: IEthergotchi): SafeHtml {
    const options = {
      width: 100,
      height: 100
    };
    const avatars = new Avatars(sprites, options);
    const svg = avatars.create(gotchi.seed + '');
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  async ngOnInit(): Promise<void> {
    await window.ethereum.enable();
    const provider = new ethers.providers.Web3Provider(window.ethereum); // 'http://127.0.0.1:7545');
    const signer = provider.getSigner();
    this.contractReadOnly = new ethers.Contract(EthergotchiArtifact.networks['5777'].address, EthergotchiArtifact.abi, signer);
    this.daiWithSigner = this.contractReadOnly.connect(signer);

    await this.loadGotchis();
  }

  public timeSinceString(date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000) - 3600;

    let interval = seconds / 31536000;

    if (interval > 1) {
      return Math.floor(interval) + ' years';
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + ' months';
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + ' days';
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + ' hours';
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + ' minutes';
    }
    return Math.floor(seconds) + ' seconds';
  }

  /*private parseBackGotchis(gotchis: IEthergotchi[]): any {
    const tempGotchis: IRawEthergotchi[] = [];
    for (const gotchi of gotchis) {
      const newGotchi = {
        id: ethers.BigNumber.from(task.id),
        isDead: task.completed,
        content: ethers.utils.formatBytes32String(task.content)
      } as IRawEthergotchi;

      tempGotchis.push(newGotchi);
    }
    return tempGotchis;
  }*/
}

export interface IEthergotchi {
  id: number;
  name: string;
  level: number;
  birthTimestamp: number;
  lastFeedTimestamp: number;
  lastPetTimestamp: number;
  seed: number;
  isDead: boolean;
}
