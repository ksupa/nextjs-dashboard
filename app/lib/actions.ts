'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import { id } from 'zod/v4/locales';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    date: z.enum(['pending', 'paid']),
    status: z.string()
});

const CreateInvoice = FormSchema.omit({ id: true, date: true })
const UpdateInvoice = FormSchema.omit({ id: true, date: true})

export async function createInvoice(formData: FormData) {
    const {customerId, amount, status} = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    })

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0]
    
    try {
        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;

        revalidatePath('/dashboard/invoices')
        redirect('/dashboard/invoices')
    } catch (e) {
        console.error(e);
    }
}

export async function updateInvoice(id: string, formData: FormData) {
        const {customerId, amount, status} = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    })

    const amountInCents = amount * 100;
    
    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
        `;

        revalidatePath('/dashboard/invoices')
        redirect('/dashboard/invoices')
    } catch (e) {
        console.error(e);
    }

}

export async function deleteInvoice(id: string) {
    try {
        await sql`
        DELETE from invoices WHERE id = ${id}
    `
        revalidatePath('/dashboard/invoices');
    } catch (e) {
        console.log(`An error has occured: ${e}`);
    }
    
}