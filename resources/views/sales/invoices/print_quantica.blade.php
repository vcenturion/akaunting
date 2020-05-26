@extends('layouts.print')

@section('title', trans_choice('general.invoices', 1) . ': ' . $invoice->invoice_number)

@section('content')
    <div class="row">
        <div class="col-58">
            <div class="text company">
                <br>
                @stack('name_input_start')
                    <strong>{{ $invoice->contact_name }}</strong><br>
                @stack('name_input_end')

                @stack('address_input_start')
                    <p>{!! nl2br($invoice->contact_address) !!}</p>
                @stack('address_input_end')

                @stack('tax_number_input_start')
                    <p>
                        @if ($invoice->contact_tax_number)
                            {{ trans('general.tax_number') }}: {{ $invoice->contact_tax_number }}
                        @endif
                    </p>
                @stack('tax_number_input_end')
            </div>
        </div>

        <div class="col-42">
            <div class="text company">
                <br>
                @stack('invoice_number_input_start')
                    <span class="float-right">{{ $invoice->invoice_number }}</span><br><br>
                @stack('invoice_number_input_end')

                @stack('invoiced_at_input_start')
                    <span class="float-right">@date($invoice->invoiced_at)</span><br><br>
                @stack('invoiced_at_input_end')
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-100">
            <div class="text">
                <table class="lines-cbs">
                    @foreach($invoice as $item)
                        <thead style="background-color:#FFFFFF !important; -webkit-print-color-adjust: exact;">
                    @endforeach
                        <tr>
                            @stack('name_th_start')
                                <th class="item text-left text-white">&nbsp;</th>
                            @stack('name_th_end')

                            @stack('quantity_th_start')
                                <th class="quantity text-white">&nbsp;</th>
                            @stack('quantity_th_end')

                            @stack('price_th_start')
                                <th class="price text-white">&nbsp;</th>
                            @stack('price_th_end')

                            @stack('total_th_start')
                                <th class="total text-white">&nbsp;</th>
                            @stack('total_th_end')
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($invoice->items as $item)
                            <tr>
                                @stack('name_td_start')
                                <td class="item">
                                    {{ $item->name }}
                                    @if (!empty($item->item->description))
                                        <br><small>{!! \Illuminate\Support\Str::limit($item->item->description, 500) !!}</small>
                                    @endif
                                </td>
                                @stack('name_td_end')

                                @stack('quantity_td_start')
                                <td class="quantity">{{ $item->quantity }}</td>
                                @stack('quantity_td_end')

                                @stack('price_td_start')
                                <td class="price">@money($item->price, $invoice->currency_code, true)</td>
                                @stack('price_td_end')

                                @stack('total_td_start')
                                <td class="total">@money($item->total, $invoice->currency_code, true)</td>
                                @stack('total_td_end')
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="row mt-9">


        <div class="col-42 float-right text-right">
            <div class="text company">
                @foreach ($invoice->totals_sorted as $total)
                    @if ($total->code != 'total')
                        @stack($total->code . '_td_start')
                            <div class="py-2">
                                <span>@money($total->amount, $invoice->currency_code, true)</span><br>
                            </div>
                        @stack($total->code . '_td_end')
                    @else
                        @if ($invoice->paid)
                            <div class="py-2">
                                <span>- @money($invoice->paid, $invoice->currency_code, true)</span><br>
                            </div>
                        @endif
                        @stack('grand_total_td_start')
                            <div class="py-2">
                                <span>@money($total->amount - $invoice->paid, $invoice->currency_code, true)</span>
                            </div>
                        @stack('grand_total_td_end')
                    @endif
                @endforeach
            </div>
        </div>
    </div>

    @if ($invoice->footer)
        <div class="row mt-4">
            <div class="col-100 text-left">
                <div class="text company">
                    <strong>{!! $invoice->footer !!}</strong>
                </div>
            </div>
        </div>
    @endif
@endsection
