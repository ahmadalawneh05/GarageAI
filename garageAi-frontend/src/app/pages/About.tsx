import { Mic, Cpu, CheckCircle, MessageCircle, Users } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

export function About() {
  const steps = [
    {
      icon: Mic,
      title: 'Record or Upload Sound',
      description: 'Capture your vehicle\'s unusual sounds using your device\'s microphone or upload an existing audio file.',
    },
    {
      icon: Cpu,
      title: 'Multi-Model AI Analysis',
      description: 'Several AI models analyze the audio in parallel and their predictions are combined into a single result with a confidence score.',
    },
    {
      icon: CheckCircle,
      title: 'Get Results & Suggestions',
      description: 'Receive a diagnostic result with a probability breakdown across possible issues and actionable next steps.',
    },
  ];

  const team = ['Maryam Rawajbeh', 'Lama Qasim', 'Mohammad Yadak'];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl mb-4">About Garage AI</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Garage AI is an intelligent automotive diagnostic system that uses artificial intelligence
            to analyze vehicle sounds and detect potential mechanical faults. Our mission is to make
            car maintenance more accessible and preventive care easier for everyone.
          </p>
        </div>

        {/* Description Section */}
        <Card className="mb-12 border-2">
          <CardContent className="p-8">
            <h2 className="text-2xl mb-4">Why Garage AI?</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Modern vehicles are complex machines, and identifying issues early can save you time,
                money, and prevent dangerous situations. Garage AI uses a machine learning model trained
                on real car fault sounds to provide instant preliminary diagnostics based on audio
                patterns, and shows you what several other independent models predicted too, for comparison.
              </p>
              <p>
                Whether you hear a strange noise from your brakes, engine, or suspension, our AI system
                can help identify the issue and provide guidance on the next steps. While we recommend
                always consulting with a certified mechanic for final diagnosis and repairs, Garage AI
                gives you valuable insights to make informed decisions about your vehicle's health.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Two Ways to Get Help */}
        <div className="mb-12 grid sm:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardContent className="p-6 space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg">Sound Analysis</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Record or upload a sound from your car and get an instant diagnosis backed by a
                confidence score and a full probability breakdown across possible issues.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-6 space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg">Ask GarageAI</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Describe what you're experiencing in a chat and get answers grounded in a
                curated automotive fault knowledge base -- no audio required.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Section */}
        <div className="mb-12">
          <h2 className="text-2xl mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                          {index + 1}
                        </span>
                        <h3 className="text-lg">{step.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <Card className="border-2 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-8">
            <h2 className="text-2xl mb-6">Key Features</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Compare results across multiple AI models',
                'Confidence & probability breakdown',
                'Chat-based diagnosis (Ask GarageAI)',
                'Maintenance recommendations',
                'Analysis history tracking',
                'Easy-to-use interface',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card className="mt-12 border-2">
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-2xl">Made By</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {team.map((name) => (
                <div key={name} className="text-center p-4 rounded-xl bg-muted/50 border border-border">
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="mt-8 p-6 bg-muted/50 rounded-xl border border-border">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            <strong>Disclaimer:</strong> Garage AI provides preliminary diagnostic assistance and should not replace 
            professional mechanical inspection. Always consult with a certified automotive technician for 
            accurate diagnosis and repairs.
          </p>
        </div>
      </div>
    </div>
  );
}
