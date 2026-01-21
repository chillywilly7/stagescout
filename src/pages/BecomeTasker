import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, ArrowRight, Phone, CheckCircle, Upload, 
  Loader2, Camera, X, DollarSign, Sparkles, Music, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';

const serviceCategories = [
  { id: 'dj', label: 'DJ Services', icon: '🎧', description: 'Spin tracks and keep the party going' },
  { id: 'audio_rental', label: 'Audio Rental', icon: '🔊', description: 'Professional sound equipment' },
  { id: 'lighting', label: 'Lighting', icon: '💡', description: 'Event lighting and effects' },
  { id: 'photographer', label: 'Photography', icon: '📸', description: 'Capture special moments' },
  { id: 'live_music', label: 'Live Music', icon: '🎸', description: 'Live performances and bands' },
];

export default function BecomeTasker() {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Phone verification
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  
  // Profile info
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [serviceRadius, setServiceRadius] = useState(25);
  const [yearsExperience, setYearsExperience] = useState('');
  
  // Services
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceDetails, setServiceDetails] = useState({});

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setName(currentUser.full_name || '');
      } catch (e) {
        base44.auth.redirectToLogin(createPageUrl('BecomeTasker'));
      }
      setIsLoadingUser(false);
    };
    loadUser();
  }, []);

  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) return;
    setIsSendingCode(true);
    
    // Generate and "send" verification code
    const code = generateCode();
    setSentCode(code);
    
    // In production, you'd send this via SMS. For now, we'll show it in an alert
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert(`Your verification code is: ${code}\n(In production, this would be sent via SMS)`);
    
    setIsCodeSent(true);
    setIsSendingCode(false);
  };

  const handleVerifyCode = () => {
    if (verificationCode === sentCode) {
      setIsPhoneVerified(true);
      setStep(2);
    } else {
      alert('Invalid code. Please try again.');
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setProfileImage(file);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProfileImageUrl(file_url);
  };

  const handleServiceToggle = (serviceId) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(s => s !== serviceId));
      const newDetails = { ...serviceDetails };
      delete newDetails[serviceId];
      setServiceDetails(newDetails);
    } else {
      setSelectedServices([...selectedServices, serviceId]);
      setServiceDetails({
        ...serviceDetails,
        [serviceId]: { description: '', hourlyRate: '', dailyRate: '', photos: [] }
      });
    }
  };

  const handleServicePhotoUpload = async (serviceId, e) => {
    const files = Array.from(e.target.files);
    const uploadedUrls = [];
    
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadedUrls.push(file_url);
    }
    
    setServiceDetails({
      ...serviceDetails,
      [serviceId]: {
        ...serviceDetails[serviceId],
        photos: [...(serviceDetails[serviceId]?.photos || []), ...uploadedUrls]
      }
    });
  };

  const removeServicePhoto = (serviceId, photoIndex) => {
    const newPhotos = serviceDetails[serviceId].photos.filter((_, i) => i !== photoIndex);
    setServiceDetails({
      ...serviceDetails,
      [serviceId]: { ...serviceDetails[serviceId], photos: newPhotos }
    });
  };

  const updateServiceDetail = (serviceId, field, value) => {
    setServiceDetails({
      ...serviceDetails,
      [serviceId]: { ...serviceDetails[serviceId], [field]: value }
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Create a tasker profile for each selected service
    for (const serviceId of selectedServices) {
      const details = serviceDetails[serviceId];
      const service = serviceCategories.find(s => s.id === serviceId);
      
      await base44.entities.Tasker.create({
        name,
        email: user.email,
        phone,
        profile_image: profileImageUrl,
        service_category: serviceId,
        bio: details.description || bio,
        hourly_rate: parseFloat(details.hourlyRate) || 0,
        daily_rate: parseFloat(details.dailyRate) || 0,
        zip_code: zipCode,
        service_radius_miles: parseInt(serviceRadius) || 25,
        portfolio_images: details.photos,
        years_experience: parseInt(yearsExperience) || 0,
        is_verified: false,
        average_rating: 0,
        total_reviews: 0,
      });
    }
    
    setIsSubmitting(false);
    window.location.href = createPageUrl('MyServices');
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const stepLabels = ['Verify', 'Profile', 'Services', 'Pricing'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Join 500+ Professionals
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Turn Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Talent</span> Into Income
          </h1>
          <p className="text-slate-400 text-lg">Set your own rates. Work when you want. Get paid fast.</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div 
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    step >= s 
                      ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30' 
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </motion.div>
                <span className={`text-xs mt-2 font-medium ${step >= s ? 'text-red-400' : 'text-slate-600'}`}>
                  {stepLabels[s-1]}
                </span>
              </div>
              {s < 4 && (
                <div className={`w-8 md:w-16 h-1 mx-1 rounded-full transition-colors ${step > s ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Phone Verification */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <motion.div 
                    className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-500/30"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Phone className="w-10 h-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-2">Verify Your Phone</h2>
                  <p className="text-slate-400">Quick verification to keep our community safe</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <Label className="text-slate-300">Phone Number</Label>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isCodeSent}
                      className="h-14 mt-2 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 rounded-xl text-lg focus:border-red-500 focus:ring-red-500/20"
                    />
                  </div>

                  {!isCodeSent ? (
                    <Button
                      onClick={handleSendCode}
                      disabled={isSendingCode || phone.length < 10}
                      className="w-full h-14 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-xl text-lg font-semibold shadow-lg shadow-red-500/25"
                    >
                      {isSendingCode ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Zap className="w-5 h-5 mr-2" />
                      )}
                      Send Verification Code
                    </Button>
                  ) : (
                    <>
                      <div>
                        <Label className="text-slate-300">Verification Code</Label>
                        <Input
                          type="text"
                          placeholder="• • • • • •"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          maxLength={6}
                          className="h-16 mt-2 bg-slate-900/50 border-slate-600 text-white rounded-xl text-center text-3xl tracking-[0.5em] font-mono focus:border-red-500"
                        />
                      </div>
                      <Button
                        onClick={handleVerifyCode}
                        disabled={verificationCode.length !== 6}
                        className="w-full h-14 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-xl text-lg font-semibold shadow-lg shadow-red-500/25"
                      >
                        Verify & Continue
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                      <button
                        onClick={() => { setIsCodeSent(false); setSentCode(''); setVerificationCode(''); }}
                        className="w-full text-sm text-slate-500 hover:text-red-400 transition-colors"
                      >
                        Didn't receive? Resend code
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Profile Setup */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Create Your Profile</h2>

                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center">
                    <div className="relative group">
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt="Profile"
                          className="w-36 h-36 rounded-2xl object-cover border-4 border-slate-700 shadow-xl"
                        />
                      ) : (
                        <div className="w-36 h-36 rounded-2xl bg-slate-700/50 border-2 border-dashed border-slate-600 flex flex-col items-center justify-center">
                          <Camera className="w-10 h-10 text-slate-500 mb-2" />
                          <span className="text-xs text-slate-500">Add Photo</span>
                        </div>
                      )}
                      <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                        <Upload className="w-5 h-5 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-sm text-slate-500 mt-3">A great photo increases bookings by 40%</p>
                  </div>

                  <div>
                    <Label className="text-slate-300">Full Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name or business name"
                      className="h-14 mt-2 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 rounded-xl focus:border-red-500"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">About You</Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell clients about yourself and your experience..."
                      className="mt-2 min-h-[120px] bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 rounded-xl focus:border-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Zip Code</Label>
                      <Input
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="90210"
                        className="h-14 mt-2 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 rounded-xl focus:border-red-500"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Service Radius</Label>
                      <Input
                        type="number"
                        value={serviceRadius}
                        onChange={(e) => setServiceRadius(e.target.value)}
                        placeholder="25 miles"
                        className="h-14 mt-2 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 rounded-xl focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300">Years of Experience</Label>
                    <Input
                      type="number"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      placeholder="5"
                      className="h-14 mt-2 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 rounded-xl focus:border-red-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-14 rounded-xl border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      disabled={!name || !zipCode || !profileImageUrl}
                      className="flex-1 h-14 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-xl text-lg font-semibold shadow-lg shadow-red-500/25"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Select Services */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-2">What Do You Offer?</h2>
                <p className="text-slate-400 mb-6">Select all the services you can provide</p>

                <div className="space-y-3">
                  {serviceCategories.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleServiceToggle(service.id)}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedServices.includes(service.id)
                          ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          selectedServices.includes(service.id) 
                            ? 'bg-gradient-to-br from-red-500 to-orange-500 border-transparent' 
                            : 'border-slate-600'
                        }`}>
                          {selectedServices.includes(service.id) && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="text-3xl">{service.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg">{service.label}</h3>
                          <p className="text-sm text-slate-400">{service.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-3 pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1 h-14 rounded-xl border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={selectedServices.length === 0}
                    className="flex-1 h-14 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-xl text-lg font-semibold shadow-lg shadow-red-500/25"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Service Details */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-6">
                {selectedServices.map((serviceId, index) => {
                  const service = serviceCategories.find(s => s.id === serviceId);
                  const details = serviceDetails[serviceId] || {};
                  
                  return (
                    <motion.div 
                      key={serviceId} 
                      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 }}
                    >
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-700">
                        <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center">
                          <span className="text-3xl">{service.icon}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">{service.label}</h3>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <Label className="text-slate-300">Service Description</Label>
                          <Textarea
                            value={details.description || ''}
                            onChange={(e) => updateServiceDetail(serviceId, 'description', e.target.value)}
                            placeholder={`Describe your ${service.label.toLowerCase()} service, equipment, style...`}
                            className="mt-2 min-h-[100px] bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 rounded-xl focus:border-red-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-900/30 rounded-2xl p-4 border border-slate-700">
                            <Label className="flex items-center gap-2 text-slate-300 mb-3">
                              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-green-400" />
                              </div>
                              Hourly Rate
                            </Label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">$</span>
                              <Input
                                type="number"
                                value={details.hourlyRate || ''}
                                onChange={(e) => updateServiceDetail(serviceId, 'hourlyRate', e.target.value)}
                                placeholder="150"
                                className="h-14 pl-10 bg-slate-800 border-slate-600 text-white text-xl font-semibold rounded-xl focus:border-red-500"
                              />
                            </div>
                          </div>
                          <div className="bg-slate-900/30 rounded-2xl p-4 border border-slate-700">
                            <Label className="flex items-center gap-2 text-slate-300 mb-3">
                              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-blue-400" />
                              </div>
                              Daily Rate
                            </Label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">$</span>
                              <Input
                                type="number"
                                value={details.dailyRate || ''}
                                onChange={(e) => updateServiceDetail(serviceId, 'dailyRate', e.target.value)}
                                placeholder="1000"
                                className="h-14 pl-10 bg-slate-800 border-slate-600 text-white text-xl font-semibold rounded-xl focus:border-red-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-slate-300 mb-3 block">Portfolio Photos</Label>
                          <div className="grid grid-cols-4 gap-3">
                            {(details.photos || []).map((photo, i) => (
                              <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border-2 border-slate-700">
                                <img src={photo} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    onClick={() => removeServicePhoto(serviceId, i)}
                                    className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                  >
                                    <X className="w-5 h-5 text-white" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <label className="aspect-square rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-500/10 transition-all group">
                              <Upload className="w-6 h-6 text-slate-500 group-hover:text-red-400 transition-colors" />
                              <span className="text-xs text-slate-500 mt-1 group-hover:text-red-400 transition-colors">Add Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleServicePhotoUpload(serviceId, e)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                    className="flex-1 h-14 rounded-xl border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 h-14 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-xl text-lg font-semibold shadow-lg shadow-red-500/25"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-5 h-5 mr-2" />
                    )}
                    Launch My Services
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Trust badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-6 mt-12 text-slate-500 text-sm"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Free to join
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Set your own rates
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Get paid weekly
          </div>
        </motion.div>
      </div>
    </div>
  );
}

