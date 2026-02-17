
import { getSession } from '@/lib/auth-server';
import { connectDB } from '@/lib/mongodb';
import { UserModel } from '@/lib/models/User';
import { InvoiceModel } from '@/lib/models/Invoice';
import { ClientModel } from '@/lib/models/Client';
import { ProductModel } from '@/lib/models/Product';
import { LaborModel } from '@/lib/models/Labor';
import EditInvoiceClient from './EditInvoiceClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { userId } = await getSession();
    const { id } = await params;

    await connectDB();

    const [currentUser, invoice, clients, products, laborCharges] = await Promise.all([
        UserModel.findOne({ id: userId }).lean(),
        InvoiceModel.findOne({ id, userId }).lean(),
        ClientModel.find({ userId }).sort({ createdAt: -1 }).lean(),
        ProductModel.find({ userId }).sort({ createdAt: -1 }).lean(),
        LaborModel.find({ userId }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!currentUser) {
        redirect('/auth/login');
    }

    if (!invoice) {
        redirect('/invoices');
    }

    // Serialize to JSON
    const serializedUser = JSON.parse(JSON.stringify(currentUser));
    const serializedInvoice = JSON.parse(JSON.stringify(invoice));
    const serializedClients = JSON.parse(JSON.stringify(clients));
    const serializedProducts = JSON.parse(JSON.stringify(products));
    const serializedLaborCharges = JSON.parse(JSON.stringify(laborCharges));

    return (
        <EditInvoiceClient
            invoice={serializedInvoice}
            currentUser={serializedUser}
            clients={serializedClients}
            products={serializedProducts}
            laborCharges={serializedLaborCharges}
        />
    );
}
