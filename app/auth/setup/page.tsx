'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store-mongodb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Building2, Mail, Phone, MapPin, FileText } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const { currentUser, updateBusinessDetails, completeSetup } = useAuthStore();
  const [formData, setFormData] = useState({
    companyName: '',
    taxId: '',
    registrationNumber: '',
    municipalTradeCertificate: '',
    email: '',
    phones: [''],
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: '',
    website: '',
    defaultTaxRate: 18,
    logo: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!currentUser) {
    router.push('/auth/login');
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    updateBusinessDetails(formData);
    completeSetup();
    router.push('/');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Business Setup</h1>
              <p className="text-muted-foreground">Complete your business profile for professional invoicing</p>
            </div>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            {/* Logo Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Company Logo</h3>
              <div className="flex items-center gap-4">
                {formData.logo && (
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden bg-muted/50">
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <span className="text-sm font-medium text-muted-foreground">Upload Logo (Optional)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Company Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company Name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Your Company Name"
                  required
                  autoFocus
                />
                <Input
                  label="Tax ID (GSTIN/PAN)"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="27AABCT1234H1Z0"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Registration Number"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="Reg. No. UDYAM-JH-04-0057906"
                />
                <Input
                  label="Municipal Trade Certificate"
                  value={formData.municipalTradeCertificate}
                  onChange={(e) => setFormData({ ...formData, municipalTradeCertificate: e.target.value })}
                  placeholder="Municipal trade Certi-DHA2310072560744"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Contact Information</h3>
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

            {/* Business Address */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Business Address</h3>
              <Input
                label="Address"
                value={formData.billingAddress}
                onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                placeholder="123 Business Street"
                required
                icon={MapPin}
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4">
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

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => router.push('/auth/login')}
              >
                Back
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
