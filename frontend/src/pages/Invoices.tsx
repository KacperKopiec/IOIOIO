import React from 'react';
import { ReceiptText } from 'lucide-react';
import InvoicePanel from '../components/Invoices/InvoicePanel';
import { Card, CardHeader, Page, PageHeader } from '../components/ui';

const Invoices: React.FC = () => {
    return (
        <Page width="wide">
            <PageHeader
                title="Faktury i płatności"
                breadcrumb={[{ label: 'Faktury i płatności' }]}
            />
            <Card padding="compact">
                <CardHeader
                    title="Rejestr faktur"
                    icon={<ReceiptText size={18} />}
                    subtitle="Podstawowe informacje o fakturach i statusach płatności"
                />
                <InvoicePanel />
            </Card>
        </Page>
    );
};

export default Invoices;
