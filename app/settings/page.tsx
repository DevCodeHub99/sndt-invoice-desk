'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/layout/PageHeader';
import { Save, Building2, Mail, Phone, MapPin, FileText, QrCode } from 'lucide-react';

export default function SettingsPage() {
  const { currentUser, updateBusinessDetails } = useAuthStore();
  const [formData, setFormData] = useState({
    companyName: currentUser?.businessDetails?.companyName || '',
    taxId: currentUser?.businessDetails?.taxId || '',
    registrationNumber: currentUser?.businessDetails?.registrationNumber || '',
    municipalTradeCertificate: currentUser?.businessDetails?.municipalTradeCertificate || '',
    email: currentUser?.businessDetails?.email || '',
    phones: currentUser?.businessDetails?.phones || [''],
    billingAddress: currentUser?.businessDetails?.billingAddress || '',
    billingCity: currentUser?.businessDetails?.billingCity || '',
    billingState: currentUser?.businessDetails?.billingState || '',
    billingZipCode: currentUser?.businessDetails?.billingZipCode || '',
    billingCountry: currentUser?.businessDetails?.billingCountry || '',
    website: currentUser?.businessDetails?.website || '',
    defaultTaxRate: currentUser?.businessDetails?.defaultTaxRate || 18,
    bankName: currentUser?.businessDetails?.bankName || '',
    accountNumber: currentUser?.businessDetails?.accountNumber || '',
    ifscCode: currentUser?.businessDetails?.ifscCode || '',
    accountHolderName: currentUser?.businessDetails?.accountHolderName || '',
    upiId: currentUser?.businessDetails?.upiId || '',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessDetails(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PageHeader
        title="Business Settings"
        description="Manage your business information for invoicing"
      />

      <div className="max-w-4xl space-y-6">
        {/* Business Details Preview */}
        {formData.companyName && (
          <Card>
            <CardContent>
              <h3 className="text-lg font-semibold text-foreground mb-6">Invoice Preview</h3>
              <div className="border rounded-lg p-6 bg-muted/30 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg border border-primary/20 flex items-center justify-center overflow-hidden bg-white">
                    <img src="/sndt logo.webp" alt="Company Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-foreground">{formData.companyName}</p>
                    {formData.registrationNumber && (
                      <p className="text-sm text-muted-foreground">Reg. No. {formData.registrationNumber}</p>
                    )}
                    {formData.municipalTradeCertificate && (
                      <p className="text-sm text-muted-foreground">Municipal Trade Certificate: {formData.municipalTradeCertificate}</p>
                    )}
                    {formData.taxId && (
                      <p className="text-sm text-muted-foreground">GSTIN/PAN: {formData.taxId}</p>
                    )}
                  </div>
                </div>
                <div className="border-t pt-4 space-y-2 text-sm">

                  {formData.billingAddress && (
                    <p className="text-muted-foreground">
                      {formData.billingAddress}, {formData.billingCity}, {formData.billingState} {formData.billingZipCode}, {formData.billingCountry}
                    </p>
                  )}
                  {formData.email && (
                    <p className="text-muted-foreground">Email: <span className="font-medium text-foreground">{formData.email}</span></p>
                  )}
                  {formData.phones.filter(p => p).map((phone, index) => (
                    <p key={index} className="text-muted-foreground">
                      {index === 0 ? 'Phone' : `Phone ${index + 1}`}: <span className="font-medium text-foreground">{phone}</span>
                    </p>
                  ))}
                  {formData.website && (
                    <p className="text-muted-foreground">Website: <span className="font-medium text-foreground">{formData.website}</span></p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Company Information */}
        <Card>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Company Information</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  This information will appear on your invoices and business documents.
                </p>
                <div className="space-y-4">
                  <Input
                    label="Company Name"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Your Company Name"
                    required
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Tax ID (GSTIN/PAN)"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="27AABCT1234H1Z0"
                    />
                    <Input
                      label="Registration Number"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      placeholder="Reg. No. UDYAM-JH-04-0057906"
                    />
                  </div>
                  <Input
                    label="Municipal Trade Certificate"
                    value={formData.municipalTradeCertificate}
                    onChange={(e) => setFormData({ ...formData, municipalTradeCertificate: e.target.value })}
                    placeholder="Municipal trade Certi-DHA2310072560744"
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Tax Settings</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Set the default tax rate for all your invoices. This will be automatically applied to all line items.
                </p>
                <div className="max-w-xs">
                  <Input
                    label="Default Tax Rate (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.defaultTaxRate}
                    onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 18 })}
                    placeholder="18"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Common rates: 5% (Essentials), 12% (General), 18% (Standard), 28% (Luxury)
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
                </div>
                <div className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="billing@company.com"
                    required
                    icon={Mail}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-semibold text-foreground">Phone Numbers</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, phones: [...formData.phones, ''] })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                      >
                        <span className="text-lg leading-none">+</span>
                        Add Phone
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formData.phones.map((phone, index) => (
                        <div key={index} className="flex items-end gap-2">
                          <div className="flex-1">
                            <Input
                              value={phone}
                              onChange={(e) => {
                                const newPhones = [...formData.phones];
                                newPhones[index] = e.target.value;
                                setFormData({ ...formData, phones: newPhones });
                              }}
                              placeholder={index === 0 ? "+91 98765 43210" : "+91 98765 43211"}
                              icon={Phone}
                              required={index === 0}
                            />
                          </div>
                          {formData.phones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newPhones = formData.phones.filter((_, i) => i !== index);
                                setFormData({ ...formData, phones: newPhones });
                              }}
                              className="h-10 px-3 rounded-lg bg-danger/10 hover:bg-danger/20 text-danger transition-colors font-medium text-sm"
                              title="Remove this phone number"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formData.phones.length === 1
                        ? 'Click "Add Phone" to add more contact numbers'
                        : `${formData.phones.length} phone number${formData.phones.length > 1 ? 's' : ''} added`}
                    </p>
                  </div>

                  <Input
                    label="Website (Optional)"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Business Address */}
        <Card>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Business Address</h3>
                </div>
                <div className="space-y-4">
                  <Input
                    label="Address"
                    value={formData.billingAddress}
                    onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                    placeholder="123 Business Street"
                    required
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <Input
                      label="City"
                      value={formData.billingCity}
                      onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                      placeholder="Mumbai"
                      required
                    />
                    <Input
                      label="State"
                      value={formData.billingState}
                      onChange={(e) => setFormData({ ...formData, billingState: e.target.value })}
                      placeholder="MH"
                      required
                    />
                    <Input
                      label="PIN Code"
                      value={formData.billingZipCode}
                      onChange={(e) => setFormData({ ...formData, billingZipCode: e.target.value })}
                      placeholder="400001"
                      required
                    />
                    <Input
                      label="Country"
                      value={formData.billingCountry}
                      onChange={(e) => setFormData({ ...formData, billingCountry: e.target.value })}
                      placeholder="India"
                      required
                    />
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Bank Details</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your bank details to display on invoices for payment purposes.
                </p>
                <div className="space-y-4">
                  <Input
                    label="Bank Name"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="State Bank of India"
                  />
                  <Input
                    label="Account Holder Name"
                    value={formData.accountHolderName}
                    onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                    placeholder="Your Company Name"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Account Number"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="1234567890123456"
                    />
                    <Input
                      label="IFSC Code"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                      placeholder="SBIN0001234"
                    />
                  </div>

                  {/* UPI Payment Section */}
                  <div className="pt-4 border-t mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <QrCode className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">UPI Payment (for QR Code)</span>
                    </div>
                    <Input
                      label="UPI ID"
                      value={formData.upiId}
                      onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                      placeholder="yourname@upi or 9876543210@paytm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Enter your UPI ID to generate a payment QR code on invoices. Customers can scan this to pay directly.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Card>
          <CardContent>
            <form onSubmit={handleSave} className="flex items-center gap-4">
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </Button>
              {saved && (
                <span className="text-sm text-success font-medium">All settings saved successfully</span>
              )}
            </form>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
