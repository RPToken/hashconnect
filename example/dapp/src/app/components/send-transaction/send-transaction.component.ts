import { Component, Inject, OnInit } from '@angular/core';
import { DialogBelonging } from '@costlydeveloper/ngx-awesome-popup';
import { Client, Hbar, HbarUnit, TokenAssociateTransaction, TransactionReceipt, TransferTransaction } from '@hashgraph/sdk';
import { Subscription } from 'rxjs';
import { HashconnectService } from 'src/app/services/hashconnect.service';
import { SigningService } from 'src/app/services/signing.service';

@Component({
    selector: 'app-send-transaction',
    templateUrl: './send-transaction.component.html',
    styleUrls: ['./send-transaction.component.scss']
})
export class SendTransactionComponent implements OnInit {

    constructor(
        @Inject('dialogBelonging') private dialogBelonging: DialogBelonging,
        public HashconnectService: HashconnectService,
        public SigningService: SigningService
    ) { }

    subscriptions: Subscription = new Subscription();

    memo: string = "";
    signingAcct: string = "";


    data = {
        transfer: {
            include_hbar: true,
            to_hbar_amount: 1,
            from_hbar_amount: -1,
            toAcc: "0.0.1234",
            include_token: false,
            return_transaction: false,
            tokenTransfers: [
                {
                    tokenId: "0.0.3084461",
                    accountId: "",
                    amount: 1
                }
            ],
            include_nft: false,
            hideNfts: false,
            nftTransfers: [
                {
                    tokenId: "0.0.14658561",
                    serialNumber: 0,
                    sender: "",
                    receiver: ""
                }
            ]
        },
        tokenAssociate: {

        }
    }


    ngOnInit(): void {
        this.subscriptions.add(
            this.dialogBelonging.EventsController.onButtonClick$.subscribe((_Button) => {
                if (_Button.ID === 'cancel') {
                    this.dialogBelonging.EventsController.close();
                }

                if (_Button.ID === 'send') {
                    this.buildTransaction();
                }
            })
        );

        this.signingAcct = this.SigningService.acc;
    }

    async buildTransaction() {
        let trans = new TransferTransaction()
            .setTransactionMemo(this.memo);

        if (this.data.transfer.include_hbar) {
            trans.addHbarTransfer(this.data.transfer.toAcc, Hbar.from(this.data.transfer.to_hbar_amount, HbarUnit.Hbar))
                .addHbarTransfer(this.signingAcct, Hbar.from(this.data.transfer.from_hbar_amount, HbarUnit.Hbar))
        }

        if (this.data.transfer.include_token) {
            this.data.transfer.tokenTransfers.forEach(tokenTrans => {
                trans.addTokenTransfer(tokenTrans.tokenId, tokenTrans.accountId, tokenTrans.amount)
            })
        }

        if (this.data.transfer.include_nft) {
            // trans.addNftTransfer()
            this.data.transfer.nftTransfers.forEach(nftTrans => {
                trans.addNftTransfer(nftTrans.tokenId, nftTrans.serialNumber, nftTrans.sender, nftTrans.receiver);
            })
        }

        let transactionBytes: Uint8Array = await this.SigningService.signAndMakeBytes(trans, this.signingAcct);

        let client: Client = await Client.forTestnet();

        // if (this.HashconnectService.pairingData) {
        //     client.setOperatorWith(
        //         this.signingAcct,
        //         "302a300506032b65700321008fef004074116a90717fbafc446c1d754f0dd562847cb12068a55a93376b964c",
        //         this.HashconnectService.hashconnect.createOperatorSigner(this.HashconnectService.pairingData.accountIds[0]));

        //     await trans.executeWithSigner().execute(client);
        // }

        let res = await this.HashconnectService.sendTransaction(transactionBytes, this.signingAcct, this.data.transfer.return_transaction, this.data.transfer.hideNfts);

        // handle response
        let responseData: any = {
            response: res,
            receipt: null
        }

        if(res.success && !this.data.transfer.return_transaction) responseData.receipt = TransactionReceipt.fromBytes(res.receipt as Uint8Array);

        this.HashconnectService.showResultOverlay(responseData);
    }

    addTokenTransfer() {
        this.data.transfer.tokenTransfers.push({
            tokenId: "0.0.3084461",
            accountId: "",
            amount: 1
        })
    }

    addNFTTransfer() {
        this.data.transfer.nftTransfers.push({
            tokenId: "0.0.14658561",
            serialNumber: 0,
            sender: "",
            receiver: ""
        })
    }

}
