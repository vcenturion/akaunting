/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

require('./../../bootstrap');

import Vue from 'vue';

import DashboardPlugin from './../../plugins/dashboard-plugin';

import Global from './../../mixins/global';

import Form from './../../plugins/form';
import Error from './../../plugins/error';
import BulkAction from './../../plugins/bulk-action';

// plugin setup
Vue.use(DashboardPlugin);

const app = new Vue({
    el: '#app',

    mixins: [
        Global
    ],

    data: function () {
        return {
            form: new Form('invoice'),
            bulk_action: new BulkAction('invoices'),
            totals: {
                sub: 0,
                item_discount: '',
                discount: '',
                discount_text: false,
                tax: 0,
                total: 0
            },
            transaction_form: new Form('transaction'),
            payment: {
                modal: false,
                amount: 0,
                title: '',
                message: '',
                html: '',
                errors: new Error()
            },
            transaction: [],
            items: '',
            discount: false,
            taxes: null,
            colspan: 6,
            edit: {
                status: false,
                currency: false,
            },
        }
    },

    mounted() {
        this.colspan = document.getElementById("items").rows[0].cells.length - 1;
        this.form.items = [];

        if (this.form.method) {
            this.onAddItem();
        }

        if (typeof invoice_items !== 'undefined' && invoice_items) {
            let items = [];
            let item_backup = this.form.item_backup[0];
            let currency_code = this.form.currency_code;

            this.edit.status = true;

            invoice_items.forEach(function(item) {
                items.push({
                    show: false,
                    currency: currency_code,
                    item_id: item.item_id,
                    name: item.name,
                    price: (item.price).toFixed(2),
                    quantity: item.quantity,
                    tax_id: item.tax_id,
                    discount: item.discount_rate,
                    total: (item.total).toFixed(2)
                });
            });

            this.form.items = items;
        }

        if ((document.getElementById('taxes') != null) && (document.getElementById('taxes').getAttribute('data-value'))) {
            this.taxes = JSON.parse(document.getElementById('taxes').getAttribute('data-value'));
        }
    },

    methods: {
        onChangeContact(contact_id) {
            if (this.edit.status && !this.edit.currency) {
                this.edit.currency = true;

                return;
            }

            axios.get(url + '/sales/customers/' + contact_id + '/currency')
            .then(response => {
                this.form.contact_name = response.data.name;
                this.form.contact_email = response.data.email;
                this.form.contact_tax_number = response.data.tax_number;
                this.form.contact_phone = response.data.phone;
                this.form.contact_address = response.data.address;
                this.form.currency_code = response.data.currency_code;
                this.form.currency_rate = response.data.currency_rate;
            })
            .catch(error => {
            });
        },

        onCalculateTotal() {
            let sub_total = 0;
            let discount_total = 0;
            let line_item_discount_total = 0;
            let tax_total = 0;
            let grand_total = 0;
            let items = this.form.items;
            let discount_in_totals = this.form.discount;

            if (items.length) {
                let index = 0;

                // get all items.
                for (index = 0; index < items.length; index++) {
                    let discount = 0;
                    // get row item and set item variable.
                    let item = items[index];

                    // item sub total calcute.
                    let item_total = item.price * item.quantity;

                    // item discount calculate.
                    let line_discount_amount = 0;

                    if (item.discount) {
                        line_discount_amount = item_total * (item.discount / 100);

                        item_discounted_total = item_total -= line_discount_amount;
                        discount = item.discount;
                    }

                    let item_discounted_total = item_total;

                    if (discount_in_totals) {
                        item_discounted_total = item_total - (item_total * (discount_in_totals / 100));
                        discount = discount_in_totals;
                    }

                    // item tax calculate.
                    let item_tax_total = 0;

                    if (item.tax_id) {
                        let inclusives = [];
                        let compounds = [];
                        let index_taxes = 0;
                        let taxes = this.taxes;

                        item.tax_id.forEach(function(item_tax_id) {
                            for (index_taxes = 0; index_taxes < taxes.length; index_taxes++) {
                                let tax = taxes[index_taxes];

                                if (item_tax_id != tax.id) {
                                    continue;
                                }

                                switch (tax.type) {
                                    case 'inclusive':
                                        inclusives.push(tax);
                                        break;
                                    case 'compound':
                                        compounds.push(tax);
                                        break;
                                    case 'fixed':
                                        item_tax_total += tax.rate * item.quantity;
                                        break;
                                    default:
                                        let item_tax_amount = (item_discounted_total / 100) * tax.rate;

                                        item_tax_total += item_tax_amount;
                                        break;
                                }
                            }
                        });

                        if (inclusives.length) {
                            let item_sub_and_tax_total = item_discounted_total + item_tax_total;

                            let inclusive_total = 0;

                            inclusives.forEach(function(inclusive) {
                                inclusive_total += inclusive.rate;
                            });

                            let item_base_rate = item_sub_and_tax_total / (1 + inclusive_total / 100);

                            item_tax_total = item_sub_and_tax_total - item_base_rate;

                            item_total = item_base_rate + discount;
                        }

                        if (compounds.length) {
                            compounds.forEach(function(compound) {
                                item_tax_total += ((item_discounted_total + item_tax_total) / 100) * compound.rate;
                            });
                        }
                    }

                    // set item total
                    if (item.discount) {
                        items[index].total = item_discounted_total;
                    } else {
                        items[index].total = item_total;
                    }

                    // calculate sub, tax, discount all items.
                    line_item_discount_total += line_discount_amount;
                    sub_total += item_total;
                    tax_total += item_tax_total;
                }
            }

            // set global total variable.
            this.totals.sub = sub_total;
            this.totals.tax = tax_total;
            this.totals.item_discount = line_item_discount_total;

            // Apply discount to total
            if (discount_in_totals) {
                discount_total = sub_total * (discount_in_totals / 100);

                this.totals.discount = discount_total;

                sub_total = sub_total - (sub_total * (discount_in_totals / 100));
            }

            // set all item grand total.
            grand_total = sub_total + tax_total;

            this.totals.total = grand_total;
        },

        // add invoice item row
        onAddItem() {
            let row = [];

            let keys = Object.keys(this.form.item_backup[0]);
            let currency_code = this.form.currency_code;

            keys.forEach(function(item) {
                if (item == 'currency') {
                    row[item] = currency_code;
                } else {
                    row[item] = '';
                }
            });

            this.form.items.push(Object.assign({}, row));
        },

        onGetItem(event, index) {
            let name = event.target.value;
            this.form.items[index].show = false;

            axios.get(url + '/common/items/autocomplete', {
                params: {
                    query: name,
                    type: 'invoice',
                    currency_code: this.form.currency_code
                }
            })
            .then(response => {
                this.items = response.data;

                if (this.items.length) {
                    this.form.items[index].show = true;
                }
            })
            .catch(error => {
            });
        },

        onSelectItem(item, index) {
            let tax_id = (item.tax_id) ? [item.tax_id.toString()] : '';

            this.form.items[index].item_id = item.id;
            this.form.items[index].name = item.name;
            this.form.items[index].price = (item.sale_price).toFixed(2);
            this.form.items[index].quantity = 1;
            this.form.items[index].tax_id = tax_id;
            this.form.items[index].total = (item.sale_price).toFixed(2);
        },

        // remove invocie item row => row_id = index
        onDeleteItem(index) {
            this.form.items.splice(index, 1);
        },

        onAddDiscount() {
            let discount = document.getElementById('pre-discount').value;

            if (discount < 0) {
                discount = 0;
            } else if (discount > 100) {
                discount = 100;
            }

            document.getElementById('pre-discount').value = discount;

            this.form.discount = discount;
            this.discount = false;

            this.onCalculateTotal();
        },

        onPayment() {
            this.payment.modal = true;

            let form = this.transaction_form;

            this.transaction_form = new Form('transaction');

            this.transaction_form.paid_at = form.paid_at;
            this.transaction_form.account_id = form.account_id;
            this.transaction_form.payment_method = form.payment_method;
        },

        addPayment() {
            this.transaction_form.submit();

            this.payment.errors = this.transaction_form.errors;

            this.form.loading = true;

            this.$emit("confirm");
        },

        closePayment() {
            this.payment = {
                modal: false,
                amount: 0,
                title: '',
                message: '',
                errors: this.transaction_form.errors
            };
        },

        // Change bank account get money and currency rate
        onChangePaymentAccount(account_id) {
            axios.get(url + '/banking/accounts/currency', {
                params: {
                    account_id: account_id
                }
            })
            .then(response => {
                this.transaction_form.currency = response.data.currency_name;
                this.transaction_form.currency_code = response.data.currency_code;
                this.transaction_form.currency_rate = response.data.currency_rate;
            })
            .catch(error => {
            });
        },
    }
});
